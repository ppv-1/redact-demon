export class MessageHandler {
    constructor(textMonitor) {
        this.textMonitor = textMonitor
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Received message:', request)

            switch (request.action) {
                case 'START_MONITORING':
                    this.textMonitor.startMonitoring()
                    sendResponse({ success: true })
                    break
                case 'STOP_MONITORING':
                    this.textMonitor.stopMonitoring()
                    sendResponse({ success: true })
                    break
                case 'START_AUTO_ANALYSIS':
                    this.textMonitor.startAutoAnalysis()
                    sendResponse({ success: true })
                    break
                case 'STOP_AUTO_ANALYSIS':
                    this.textMonitor.stopAutoAnalysis()
                    sendResponse({ success: true })
                    break
                case 'INIT_MODEL':
                    this.textMonitor.initializeModel().then(result => {
                        sendResponse(result)
                    })
                    return true
                case 'GET_CURRENT_TEXT':
                    const text = this.textMonitor.getCurrentText()
                    sendResponse({ text })
                    break
                case 'ANALYZE_CURRENT_TEXT':
                    this.textMonitor.analyzeCurrentText().then(result => {
                        sendResponse(result)
                    })
                    return true
                case 'REPLACE_TEXT':
                    this.textMonitor.replaceCurrentText(request.newText)
                    sendResponse({ success: true })
                    break
                case 'REDACT_ENTITIES':
                case 'REDACT_ENTITIES_FROM_CONTEXT':
                    this.textMonitor.redactAllEntities()
                    sendResponse({ success: true })
                    break
                case 'GET_LAST_ANALYSIS':
                    sendResponse({ 
                        success: true, 
                        result: this.textMonitor.getLastAnalysisResult(),
                        text: this.textMonitor.getCurrentText()
                    })
                    break
            }
        })
    }
}