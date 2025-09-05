export class InputManager {
    constructor(textMonitor) {
        this.textMonitor = textMonitor
        this.currentInput = null
        this.lastText = ''
        this.isMonitoring = false
        this.attachedInputs = new Set()
    }

    startMonitoring() {
        if (this.isMonitoring) return
        this.isMonitoring = true
        this.attachToExistingInputs()
        this.observeNewInputs()
    }

    stopMonitoring() {
        this.isMonitoring = false
        this.detachFromAllInputs()
        if (this.observer) {
            this.observer.disconnect()
        }
    }

    attachToExistingInputs() {
        // Find all input elements
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea, [contenteditable="true"]')
        
        inputs.forEach(input => {
            this.attachToInput(input)
        })
    }

    attachToInput(input) {
        if (this.attachedInputs.has(input)) return

        console.log('Attaching to input:', input.tagName, input.className)
        
        // Add focus listener for immediate analysis
        input.addEventListener('focus', (e) => {
            this.handleInputFocus(e.target)
        })

        // Add input listener for text changes
        input.addEventListener('input', (e) => {
            this.handleInputChange(e.target)
        })

        // Add selection change listener for when user selects text
        input.addEventListener('selectionchange', (e) => {
            if (e.target === this.currentInput) {
                this.handleSelectionChange(e.target)
            }
        })

        // Add click listener as backup for selection
        input.addEventListener('click', (e) => {
            if (e.target === this.currentInput) {
                this.handleSelectionChange(e.target)
            }
        })

        this.attachedInputs.add(input)
    }

    handleInputFocus(input) {
        console.log('Input focused:', input.tagName)
        
        // Set as current input
        this.currentInput = input
        this.lastText = this.getTextFromInput(input)
        
        // Notify text monitor about focus event
        this.textMonitor.onInputFocus(input)
    }

    handleInputChange(input) {
        if (!this.textMonitor.isAutoAnalyzing) return

        const currentText = this.getTextFromInput(input)
        
        // Only process if text actually changed
        if (currentText !== this.lastText) {
            this.lastText = currentText
            this.currentInput = input
            
            if (currentText.trim()) {
                console.log('Text changed, analyzing:', currentText.substring(0, 50) + '...')
                this.textMonitor.analysisManager.debounceAnalysis(currentText)
            }
        }
    }

    handleSelectionChange(input) {
        // When user selects text or moves cursor, re-analyze if there's content
        const currentText = this.getTextFromInput(input)
        if (currentText && currentText.trim()) {
            console.log('Selection changed, re-analyzing text')
            // Use shorter debounce for selection changes
            this.textMonitor.analysisManager.debounceAnalysis(currentText, 300)
        }
    }

    observeNewInputs() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the node itself is an input
                        if (this.isInputElement(node)) {
                            this.attachToInput(node)
                        }
                        
                        // Check for input descendants
                        const inputs = node.querySelectorAll?.('input[type="text"], input[type="email"], input[type="password"], textarea, [contenteditable="true"]')
                        inputs?.forEach(input => {
                            this.attachToInput(input)
                        })
                    }
                })
            })
        })

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        })
    }

    isInputElement(element) {
        return (
            (element.tagName === 'INPUT' && ['text', 'email', 'password'].includes(element.type)) ||
            element.tagName === 'TEXTAREA' ||
            element.contentEditable === 'true'
        )
    }

    detachFromAllInputs() {
        this.attachedInputs.clear()
        this.currentInput = null
    }

    getCurrentText() {
        if (!this.currentInput) return ''
        return this.getTextFromInput(this.currentInput)
    }

    getTextFromInput(input) {
        if (input.contentEditable === 'true') {
            return input.textContent || input.innerText || ''
        }
        return input.value || ''
    }

    replaceCurrentText(newText) {
        if (!this.currentInput) return

        if (this.currentInput.contentEditable === 'true') {
            this.currentInput.textContent = newText
        } else {
            this.currentInput.value = newText
        }
        
        // Update last text to prevent re-analysis
        this.lastText = newText
    }
}