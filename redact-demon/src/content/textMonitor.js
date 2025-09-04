import { modelService } from '../services/ModelService.js'
import { InputManager } from './inputManager.js'
import { AnalysisManager } from './analysisManager.js'
import { RedactionManager } from './redactionManager.js'
import { MessageHandler } from './messageHandler.js'
import { ContextMenuManager } from './contextMenuManager.js'

export default class TextMonitor {
    constructor() {
        this.isMonitoring = false
        this.isAutoAnalyzing = true
        this.inputManager = new InputManager(this)
        this.analysisManager = new AnalysisManager(this, modelService)
        this.redactionManager = new RedactionManager(this)
        this.messageHandler = new MessageHandler(this)
        this.contextMenuManager = new ContextMenuManager()
        
        this.messageHandler.setupMessageListener()
        console.log('TextMonitor initialized with ModelService')
    }

    async initializeModel() {
        return await this.analysisManager.initializeModel()
    }

    startAutoAnalysis() {
        this.isAutoAnalyzing = true
        console.log('Auto-analysis enabled')
    }

    stopAutoAnalysis() {
        this.isAutoAnalyzing = false
        this.analysisManager.clearDebounceTimer()
        console.log('Auto-analysis disabled')
    }

    startMonitoring() {
        if (this.isMonitoring) {
            console.log('Already monitoring')
            return
        }

        this.isMonitoring = true
        this.inputManager.startMonitoring()
        console.log('Text monitoring started')
    }

    stopMonitoring() {
        this.isMonitoring = false
        this.stopAutoAnalysis()
        this.inputManager.stopMonitoring()
        console.log('Text monitoring stopped')
    }

    getCurrentText() {
        return this.inputManager.getCurrentText()
    }

    replaceCurrentText(newText) {
        this.inputManager.replaceCurrentText(newText)
    }

    async analyzeCurrentText() {
        return await this.analysisManager.analyzeCurrentText()
    }

    redactAllEntities() {
        this.redactionManager.redactAllEntities()
    }

    getLastAnalysisResult() {
        return this.analysisManager.getLastAnalysisResult()
    }

    // Getters for managers to access shared state
    get currentInput() {
        return this.inputManager.currentInput
    }

    get lastAnalysisResult() {
        return this.analysisManager.lastAnalysisResult
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