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
        this.setupPatternSettingsListener()
        console.log('TextMonitor initialized with ModelService')
    }

    setupPatternSettingsListener() {
        // Listen for pattern setting updates from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'PATTERN_SETTINGS_UPDATED') {
                this.analysisManager.updateRegexPattern(message.patternId, message.enabled)
                console.log(`Updated pattern ${message.patternId} to ${message.enabled}`)
            } else if (message.type === 'ALL_PATTERNS_UPDATED') {
                message.patterns.forEach(pattern => {
                    this.analysisManager.updateRegexPattern(pattern.id, pattern.enabled)
                })
                console.log('Updated all pattern settings')
            }
        })
    }

    async initializeModel() {
        return await this.analysisManager.initializeModel()
    }

    async loadPatternSettings() {
        // Load saved pattern settings
        try {
            await this.analysisManager.regexMatcher.loadSettings()
            console.log('Pattern settings loaded successfully')
        } catch (error) {
            console.warn('Failed to load pattern settings:', error)
        }
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
    
    // Load pattern settings first
    await textMonitor.loadPatternSettings()
    
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