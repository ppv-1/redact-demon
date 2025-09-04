export class AnalysisManager {
    constructor(textMonitor, modelService) {
        this.textMonitor = textMonitor
        this.modelService = modelService
        this.debounceTimer = null
        this.lastAnalysisResult = null
    }

    async initializeModel() {
        try {
            console.log('Initializing model in content script...')
            await this.modelService.initializeModel()
            console.log('Model initialized successfully')
            return { success: true, message: 'Model loaded in content script' }
        } catch (error) {
            console.error('Failed to initialize model:', error)
            return { success: false, message: error.message }
        }
    }

    clearDebounceTimer() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = null
        }
    }

    debounceAnalysis(text) {
        this.clearDebounceTimer()

        this.debounceTimer = setTimeout(() => {
            this.performAnalysis(text)
        }, 500)
    }

    async performAnalysis(text) {
        if (!this.modelService.isModelLoaded()) {
            console.log('Model not loaded, skipping analysis')
            return
        }

        try {
            console.log('Analyzing text:', text)
            const result = await this.modelService.analyzeText(text)
            console.log('Analysis result:', typeof result)

            this.lastAnalysisResult = result

            result.forEach((entity, index) => {
                console.log(`Entity ${index + 1}:`, {
                    word: entity.word,
                    type: entity.entity,
                    score: (entity.score * 100).toFixed(2) + '%',
                    index: entity.index
                })
            })

            this.textMonitor.contextMenuManager.updateForCurrentInput(
                this.textMonitor.getCurrentText(),
                this.lastAnalysisResult
            )

        } catch (error) {
            console.error('Analysis failed:', error)
        }
    }

    async analyzeCurrentText() {
        const text = this.textMonitor.getCurrentText()
        if (!text.trim()) {
            return { success: false, message: 'No text to analyze' }
        }

        try {
            const result = await this.modelService.analyzeText(text)
            console.log('Manual analysis result:', result)
            return {
                success: true,
                result: result,
                message: `Analysis complete: ${result.length} entities found`
            }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    getLastAnalysisResult() {
        return this.lastAnalysisResult
    }

    clearLastAnalysisResult() {
        this.lastAnalysisResult = null
    }
}