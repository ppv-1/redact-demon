export class InputManager {
    constructor(textMonitor) {
        this.textMonitor = textMonitor
        this.currentInput = null
        this.observers = []
    }

    startMonitoring() {
        this.attachToExistingInputs()
        this.watchForNewInputs()
    }

    stopMonitoring() {
        this.observers.forEach(observer => observer.disconnect())
        this.observers = []
        this.currentInput = null
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
            
            this.textMonitor.contextMenuManager.updateForCurrentInput(
                this.textMonitor.getCurrentText(),
                this.textMonitor.lastAnalysisResult
            )
        })

        element.addEventListener('input', (e) => {
            if (this.currentInput === element) {
                const text = this.getElementText(element)
                // console.log('Text changed:', text)

                if (this.textMonitor.isAutoAnalyzing && text.trim().length > 3) {
                    this.textMonitor.analysisManager.debounceAnalysis(text)
                }
            }
        })

        element.addEventListener('blur', () => {
            if (this.currentInput === element) {
                this.currentInput = null
                this.textMonitor.contextMenuManager.updateContextMenu(false, 0)
            }
        })

        element.addEventListener('contextmenu', () => {
            this.textMonitor.contextMenuManager.updateForCurrentInput(
                this.textMonitor.getCurrentText(),
                this.textMonitor.lastAnalysisResult
            )
        })
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