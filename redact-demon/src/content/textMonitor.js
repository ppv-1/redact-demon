import { modelService } from '../services/ModelService.js'

export default class TextMonitor {
    constructor() {
        this.isMonitoring = false
        this.currentInput = null
        this.observers = []
        this.isAutoAnalyzing = true
        this.debounceTimer = null
        this.lastAnalysisResult = null
        this.setupMessageListener()
        console.log('TextMonitor initialized with ModelService')
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Received message:', request)

            switch (request.action) {
                case 'START_MONITORING':
                    this.startMonitoring()
                    sendResponse({ success: true })
                    break
                case 'STOP_MONITORING':
                    this.stopMonitoring()
                    sendResponse({ success: true })
                    break
                case 'START_AUTO_ANALYSIS':
                    this.startAutoAnalysis()
                    sendResponse({ success: true })
                    break
                case 'STOP_AUTO_ANALYSIS':
                    this.stopAutoAnalysis()
                    sendResponse({ success: true })
                    break
                case 'INIT_MODEL':
                    this.initializeModel().then(result => {
                        sendResponse(result)
                    })
                    return true // Keep channel open for async response
                case 'GET_CURRENT_TEXT':
                    const text = this.getCurrentText()
                    sendResponse({ text })
                    break
                case 'ANALYZE_CURRENT_TEXT':
                    this.analyzeCurrentText().then(result => {
                        sendResponse(result)
                    })
                    return true
                case 'REPLACE_TEXT':
                    this.replaceCurrentText(request.newText)
                    sendResponse({ success: true })
                    break
                case 'REDACT_PERSONS':
                    this.redactPersonEntities()
                    sendResponse({ success: true })
                    break
                case 'REDACT_PERSONS_FROM_CONTEXT':
                    this.redactPersonEntities()
                    sendResponse({ success: true })
                    break
                case 'GET_LAST_ANALYSIS':
                    sendResponse({ 
                        success: true, 
                        result: this.lastAnalysisResult,
                        text: this.getCurrentText()
                    })
                    break
            }
        })
    }

    async initializeModel() {
        try {
            console.log('Initializing model in content script...')
            await modelService.initializeModel()
            console.log('Model initialized successfully')
            return { success: true, message: 'Model loaded in content script' }
        } catch (error) {
            console.error('Failed to initialize model:', error)
            return { success: false, message: error.message }
        }
    }

    startAutoAnalysis() {
        this.isAutoAnalyzing = true
        console.log('Auto-analysis enabled')
    }

    stopAutoAnalysis() {
        this.isAutoAnalyzing = false
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = null
        }
        console.log('Auto-analysis disabled')
    }

    startMonitoring() {
        if (this.isMonitoring) {
            console.log('Already monitoring')
            return
        }

        this.isMonitoring = true
        this.attachToExistingInputs()
        this.watchForNewInputs()
        console.log('Text monitoring started')
    }

    stopMonitoring() {
        this.isMonitoring = false
        this.stopAutoAnalysis()
        this.observers.forEach(observer => observer.disconnect())
        this.observers = []
        this.currentInput = null
        console.log('Text monitoring stopped')
    }

    attachToExistingInputs() {
        const selectors = [
            'input[type="text"]',
            'input[type="email"]',
            'input[type="search"]',
            'textarea',
            '[contenteditable="true"]',
            '[role="textbox"]',
            '.chat-input',
            '.message-input',
            '#message',
            '[placeholder*="message"]',
            '[placeholder*="chat"]',
            '[placeholder*="type"]',
            '[placeholder*="search"]',
            '[placeholder*="comment"]'
        ]

        let inputCount = 0
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                this.attachToInput(element)
                inputCount++
            })
        })

        console.log(`Attached to ${inputCount} existing input elements`)
    }

    attachToInput(element) {
        if (element.dataset.redactDemonAttached) return
        element.dataset.redactDemonAttached = 'true'

        console.log('Attaching to input:', element.tagName, element.className, element.placeholder)

        element.addEventListener('focus', () => {
            this.currentInput = element
            console.log('Input focused:', {
                tag: element.tagName,
                placeholder: element.placeholder
            })
            
            // Update context menu when input is focused
            this.updateContextMenuForCurrentInput()
        })

        element.addEventListener('input', (e) => {
            if (this.currentInput === element) {
                const text = this.getElementText(element)
                console.log('Text changed:', text)

                // Auto-analyze if enabled
                if (this.isAutoAnalyzing && text.trim().length > 3) {
                    this.debounceAnalysis(text)
                }
            }
        })

        element.addEventListener('blur', () => {
            if (this.currentInput === element) {
                this.currentInput = null
                // Disable context menu when no input is focused
                this.updateContextMenu(false, 0)
            }
        })

        // Listen for right-click to ensure context menu is up to date
        element.addEventListener('contextmenu', () => {
            this.updateContextMenuForCurrentInput()
        })
    }

    updateContextMenuForCurrentInput() {
        if (!this.currentInput) {
            this.updateContextMenu(false, 0)
            return
        }

        const text = this.getCurrentText()
        if (!text.trim() || !this.lastAnalysisResult) {
            this.updateContextMenu(false, 0)
            return
        }

        const personEntities = this.getPersonEntities(this.lastAnalysisResult)
        this.updateContextMenu(personEntities.length > 0, personEntities.length)
    }

    updateContextMenu(hasPersonEntities, personCount) {
        // Send message to background script to update context menu
        chrome.runtime.sendMessage({
            action: 'UPDATE_CONTEXT_MENU',
            hasPersonEntities: hasPersonEntities,
            personCount: personCount
        }).catch(error => {
            console.log('Failed to update context menu:', error)
        })
    }

    debounceAnalysis(text) {
        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
        }

        // Set new timer to analyze after 500ms of no typing
        this.debounceTimer = setTimeout(() => {
            this.performAnalysis(text)
        }, 500)
    }

    async performAnalysis(text) {
        if (!modelService.isModelLoaded()) {
            console.log('Model not loaded, skipping analysis')
            return
        }

        try {
            console.log('Analyzing text:', text)
            const result = await modelService.analyzeText(text)
            console.log('Analysis result:', typeof result)

            // Store the result for potential redaction
            this.lastAnalysisResult = result

            result.forEach((entity, index) => {
                console.log(`Entity ${index + 1}:`, {
                    word: entity.word,
                    type: entity.entity,
                    score: (entity.score * 100).toFixed(2) + '%',
                    index: entity.index
                })
            })

            // Update context menu based on analysis
            this.updateContextMenuForCurrentInput()

        } catch (error) {
            console.error('Analysis failed:', error)
        }
    }

    getPersonEntities(analysisResult) {
        if (!analysisResult || !Array.isArray(analysisResult)) return []
        
        return analysisResult.filter(entity => 
            entity.entity === 'B-PER' || entity.entity === 'I-PER'
        )
    }

    redactPersonEntities() {
        if (!this.lastAnalysisResult || !this.currentInput) {
            console.log('No analysis result or current input to redact')
            return
        }

        const currentText = this.getCurrentText()
        const personEntities = this.getPersonEntities(this.lastAnalysisResult)
        
        if (personEntities.length === 0) {
            console.log('No person entities to redact')
            return
        }

        // Group consecutive tokens that form complete names
        const nameGroups = this.groupConsecutiveTokens(personEntities)
        
        // Convert token positions to character positions
        const characterPositions = this.getCharacterPositions(currentText, nameGroups)
        
        // Sort by character position in descending order to avoid index shifting
        const sortedPositions = characterPositions.sort((a, b) => b.start - a.start)
        
        let redactedText = currentText
        
        sortedPositions.forEach(position => {
            const redaction = '[REDACTED]'
            
            // Replace the name with [REDACTED]
            const beforeName = redactedText.substring(0, position.start)
            const afterName = redactedText.substring(position.end)
            redactedText = beforeName + redaction + afterName
        })

        this.replaceCurrentText(redactedText)
        console.log('Text redacted successfully')
        
        // Clear analysis result after redaction
        this.lastAnalysisResult = null
        // Update context menu to disable it
        this.updateContextMenu(false, 0)
    }

    groupConsecutiveTokens(personEntities) {
        if (personEntities.length === 0) return []
        
        // Sort by token index
        const sorted = personEntities.sort((a, b) => a.index - b.index)
        const groups = []
        let currentGroup = [sorted[0]]
        
        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i]
            const previous = sorted[i - 1]
            
            // If tokens are consecutive and form a complete name
            if (current.index === previous.index + 1 && 
                (current.entity === 'I-PER' || previous.entity === 'B-PER')) {
                currentGroup.push(current)
            } else {
                groups.push(currentGroup)
                currentGroup = [current]
            }
        }
        groups.push(currentGroup)
        
        return groups
    }

    getCharacterPositions(originalText, nameGroups) {
        const positions = []
        
        for (const group of nameGroups) {
            // Reconstruct the full name from tokens
            const fullName = group.map(token => token.word).join('').replace(/^##/, '')
            
            // Find the character position in the original text
            const charPosition = this.findNameInText(originalText, fullName, group[0].word)
            
            if (charPosition !== -1) {
                positions.push({
                    start: charPosition,
                    end: charPosition + fullName.length,
                    name: fullName,
                    tokens: group
                })
            }
        }
        
        return positions
    }

    findNameInText(text, fullName, firstToken) {
        // Try exact match first
        let position = text.indexOf(fullName)
        if (position !== -1) return position
        
        // Try case-insensitive match
        position = text.toLowerCase().indexOf(fullName.toLowerCase())
        if (position !== -1) return position
        
        // Try finding by first token (for partially reconstructed names)
        const cleanFirstToken = firstToken.replace(/^##/, '')
        const tokenPositions = []
        let searchPos = 0
        
        while (searchPos < text.length) {
            const pos = text.toLowerCase().indexOf(cleanFirstToken.toLowerCase(), searchPos)
            if (pos === -1) break
            
            // Check if this is a word boundary
            const beforeChar = pos > 0 ? text[pos - 1] : ' '
            const afterChar = pos + cleanFirstToken.length < text.length ? 
                             text[pos + cleanFirstToken.length] : ' '
            
            if (/\s/.test(beforeChar) && (/\s/.test(afterChar) || /[.,!?;:]/.test(afterChar))) {
                tokenPositions.push(pos)
            }
            
            searchPos = pos + 1
        }
        
        // Return the first valid word boundary match
        return tokenPositions.length > 0 ? tokenPositions[0] : -1
    }

    async analyzeCurrentText() {
        const text = this.getCurrentText()
        if (!text.trim()) {
            return { success: false, message: 'No text to analyze' }
        }

        try {
            const result = await modelService.analyzeText(text)
            console.log('Manual analysis result:', result)
            return {
                success: true,
                result: result,
                message: `${result.label}: ${(result.score * 100).toFixed(2)}% confidence`
            }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    watchForNewInputs() {
        const observer = new MutationObserver(mutations => {
            let newInputs = 0

            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (this.isInputElement(node)) {
                            this.attachToInput(node)
                            newInputs++
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll('input, textarea, [contenteditable="true"], [role="textbox"]').forEach(input => {
                                this.attachToInput(input)
                                newInputs++
                            })
                        }
                    }
                })
            })

            if (newInputs > 0) {
                console.log(`Found ${newInputs} new input elements`)
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })

        this.observers.push(observer)
    }

    isInputElement(element) {
        return element.tagName === 'INPUT' ||
            element.tagName === 'TEXTAREA' ||
            element.contentEditable === 'true' ||
            element.getAttribute('role') === 'textbox'
    }

    getCurrentText() {
        if (!this.currentInput) return ''
        return this.getElementText(this.currentInput)
    }

    getElementText(element) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            return element.value
        } else if (element.contentEditable === 'true') {
            return element.textContent || element.innerText
        }
        return ''
    }

    replaceCurrentText(newText) {
        if (!this.currentInput) return

        if (this.currentInput.tagName === 'INPUT' || this.currentInput.tagName === 'TEXTAREA') {
            this.currentInput.value = newText
            this.currentInput.dispatchEvent(new Event('input', { bubbles: true }))
        } else if (this.currentInput.contentEditable === 'true') {
            this.currentInput.textContent = newText
            this.currentInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
    }
}

// Initialize the text monitor
const textMonitor = new TextMonitor()


// Auto-start monitoring after page load
setTimeout(async () => {
    console.log('Auto-starting Redact Demon')
    try {
        await textMonitor.initializeModel()
        console.log("Model Loaded")

    } catch (error) {
        console.log("Model initialization failed")
    }

    textMonitor.startMonitoring()
}, 1000)

// Expose for testing
window.redactDemonMonitor = textMonitor