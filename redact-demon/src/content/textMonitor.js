import { modelService } from '../services/ModelService.js'
import { InputManager } from './inputManager.js'
import { AnalysisManager } from './analysisManager.js'
import { RedactionManager } from './redactionManager.js'
import { MessageHandler } from './messageHandler.js'
import { ContextMenuManager } from './contextMenuManager.js'
import { NotificationManager } from './notificationManager.js'

export default class TextMonitor {
    constructor() {
        this.isMonitoring = false
        this.isAutoAnalyzing = true
        this.inputManager = new InputManager(this)
        this.analysisManager = new AnalysisManager(this, modelService)
        this.redactionManager = new RedactionManager(this)
        this.messageHandler = new MessageHandler(this)
        this.contextMenuManager = new ContextMenuManager()
        this.notificationManager = new NotificationManager()
        
        this.messageHandler.setupMessageListener()
        this.setupPatternSettingsListener()
        this.setupModelNotificationListener()
    }

    setupModelNotificationListener() {
        // Listen for model notification messages
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'SHOW_MODEL_NOTIFICATION') {
                this.notificationManager.showModelNotification(message.message, message.notificationType)
            }
        })
    }

    setupPatternSettingsListener() {
        // Listen for pattern setting updates from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'PATTERN_SETTINGS_UPDATED') {
                this.analysisManager.updateRegexPattern(message.patternId, message.enabled)
                // Re-analyze after updating patterns
                this.reAnalyzeCurrentText()

            } else if (message.type === 'ALL_PATTERNS_UPDATED') {
                message.patterns.forEach(pattern => {
                    this.analysisManager.updateRegexPattern(pattern.id, pattern.enabled)
                })
                this.reAnalyzeCurrentText()
            }
        })
    }

    async reAnalyzeCurrentText() {
        // Only re-analyze if we're currently monitoring and have an active input
        if (!this.isMonitoring || !this.currentInput) {
            return
        }

        const currentText = this.getCurrentText()
        if (currentText && currentText.trim()) {

            // Trigger analysis with current text
            this.analysisManager.debounceAnalysis(currentText)
        }
    }

    // Method called when input is focused/selected
    onInputFocus(inputElement) {

        // Clear any existing debounce timer
        this.analysisManager.clearDebounceTimer()

        // Get current text and analyze immediately
        const currentText = this.getCurrentText()
        if (currentText && currentText.trim()) {
            // Use shorter debounce for focus events
            this.analysisManager.debounceAnalysis(currentText, 200) // 200ms instead of 500ms
        }
    }

    // Method to show notification for detected entities
    showEntityNotification(groupedEntities) {
        if (groupedEntities && groupedEntities.length > 0) {
            // Extract entity types from grouped entities
            const entityTypes = [...new Set(groupedEntities.map(e => e.entityType))]
            this.notificationManager.showNotification(groupedEntities.length, entityTypes)
            
        }
    }

    async initializeModel() {
        return await this.analysisManager.initializeModel()
    }

    async loadPatternSettings() {
        // Load saved pattern settings
        try {
            await this.analysisManager.regexMatcher.loadSettings()
        } catch (error) {
            console.warn('Failed to load pattern settings:', error)
        }
    }

    startAutoAnalysis() {
        this.isAutoAnalyzing = true
    }

    stopAutoAnalysis() {
        this.isAutoAnalyzing = false
        this.analysisManager.clearDebounceTimer()
    }

    startMonitoring() {
        if (this.isMonitoring) {
            return
        }

        this.isMonitoring = true
        this.inputManager.startMonitoring()
    }

    stopMonitoring() {
        this.isMonitoring = false
        this.stopAutoAnalysis()
        this.inputManager.stopMonitoring()
        this.notificationManager.hideNotification()
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

// Start monitoring
setTimeout(async () => {
    await textMonitor.loadPatternSettings()

    try {
        await textMonitor.initializeModel()
    } catch (error) {
        console.error("Model initialization failed:", error.message)
        // Show error notification
        textMonitor.notificationManager.showModelNotification(
            'Failed to load ML model. Using regex patterns only.', 
            'error'
        )
    }

    textMonitor.startMonitoring()
}, 1000)

window.redactDemonMonitor = textMonitor