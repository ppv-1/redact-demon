import { modelService } from '../services/ModelService.js'

export default class TextMonitor {
    constructor() {
        this.isMonitoring = false
        this.currentInput = null
        this.observers = []
        this.isAutoAnalyzing = true
        this.debounceTimer = null
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
            }
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

            result.forEach((entity, index) => {
                console.log(`Entity ${index + 1}:`, {
                    word: entity.word,
                    type: entity.entity,
                    score: (entity.score * 100).toFixed(2) + '%',
                    index: entity.index
                })

            })


        } catch (error) {
            console.error('Analysis failed:', error)
        }
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

    showWarning(text, result) {
        // Create a subtle warning indicator
        if (this.currentInput && !this.currentInput.dataset.warningShown) {
            const originalBorder = this.currentInput.style.border
            this.currentInput.style.border = '2px solid #ff6b6b'
            this.currentInput.dataset.warningShown = 'true'

            // Reset after 2 seconds
            setTimeout(() => {
                this.currentInput.style.border = originalBorder
                delete this.currentInput.dataset.warningShown
            }, 2000)

            console.log('Warning shown for negative sentiment')
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