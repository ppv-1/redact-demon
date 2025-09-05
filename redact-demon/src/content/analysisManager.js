import { RegexPatternMatcher } from '../utils/regexPatternMatcher.js'

export class AnalysisManager {
    constructor(textMonitor, modelService) {
        this.textMonitor = textMonitor
        this.modelService = modelService
        this.regexMatcher = new RegexPatternMatcher()
        this.debounceTimer = null
        this.lastAnalysisResult = null
        this.lastRegexResult = null
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

    debounceAnalysis(text, delay = 500) {
        this.clearDebounceTimer()

        this.debounceTimer = setTimeout(() => {
            this.performAnalysis(text)
        }, delay)
    }

    async performAnalysis(text) {
        try {
            console.log('Starting analysis for text:', text)
            
            // Step 1: Regex pattern matching (runs first)
            console.log('Running regex pattern analysis...')
            const regexResults = this.regexMatcher.analyzeText(text)
            this.lastRegexResult = regexResults
            
            console.log(`Regex analysis found ${regexResults.length} entities:`, regexResults)

            // Step 2: ML model analysis (if model is loaded)
            let mlResults = []
            if (this.modelService.isModelLoaded()) {
                console.log('Running ML model analysis...')
                mlResults = await this.modelService.analyzeText(text)
                console.log(`ML analysis found ${mlResults.length} entities:`, mlResults)
            } else {
                console.log('Model not loaded, skipping ML analysis')
            }

            // Step 3: Combine results (regex takes priority)
            const combinedResults = this.combineAnalysisResults(regexResults, mlResults, text)
            this.lastAnalysisResult = combinedResults

            console.log(`Combined analysis result: ${combinedResults.length} total entities`)
            
            // Log detailed results
            combinedResults.forEach((entity, index) => {
                console.log(`Entity ${index + 1}:`, {
                    word: entity.word,
                    type: entity.entity,
                    score: (entity.score * 100).toFixed(2) + '%',
                    source: entity.source || 'ml',
                    index: entity.index
                })
            })

            // Update context menu
            this.textMonitor.contextMenuManager.updateForCurrentInput(
                this.textMonitor.getCurrentText(),
                this.lastAnalysisResult
            )

        } catch (error) {
            console.error('Analysis failed:', error)
        }
    }
        
    /**
     * Combine regex and ML results, giving priority to regex matches
     * @param {Array} regexResults - Results from regex pattern matching
     * @param {Array} mlResults - Results from ML model
     * @param {string} text - Original text
     * @returns {Array} Combined results
     */
    combineAnalysisResults(regexResults, mlResults, text) {
        const combined = [...regexResults]
        
        // Add ML results that don't overlap with regex results
        for (const mlEntity of mlResults) {
            const mlStart = this.getCharacterPosition(text, mlEntity)
            const mlEnd = mlStart + mlEntity.word.length
            
            // Check if this ML entity overlaps with any regex entity
            const hasOverlap = regexResults.some(regexEntity => {
                const regexStart = regexEntity.start
                const regexEnd = regexEntity.end
                
                return (mlStart >= regexStart && mlStart < regexEnd) ||
                       (mlEnd > regexStart && mlEnd <= regexEnd) ||
                       (mlStart <= regexStart && mlEnd >= regexEnd)
            })
            
            if (!hasOverlap) {
                // Add source indicator to ML results
                combined.push({
                    ...mlEntity,
                    source: 'ml',
                    start: mlStart,
                    end: mlEnd
                })
            }
        }
        
        // Sort by start position
        return combined.sort((a, b) => (a.start || 0) - (b.start || 0))
    }

    /**
     * Get character position for ML entity
     * @param {string} text - Original text
     * @param {Object} entity - ML entity
     * @returns {number} Character position
     */
    getCharacterPosition(text, entity) {
        // For tokenized models, we need to reconstruct the original text positions
        // by tracking actual character positions rather than token positions
        
        // Split text into tokens similar to how the model would
        const tokens = text.split(/(\s+)/) // Keep whitespace as separate tokens
        let charPosition = 0
        let tokenIndex = 0
        
        // Find the character position by iterating through tokens
        for (const token of tokens) {
            if (tokenIndex === entity.index) {
                return charPosition
            }
            
            if (token.trim()) { // Only count non-whitespace tokens
                tokenIndex++
            }
            charPosition += token.length
        }
        
        return charPosition
    }

    async analyzeCurrentText() {
        const text = this.textMonitor.getCurrentText()
        if (!text.trim()) {
            return { success: false, message: 'No text to analyze' }
        }

        try {
            // Run both regex and ML analysis
            const regexResults = this.regexMatcher.analyzeText(text)
            
            let mlResults = []
            if (this.modelService.isModelLoaded()) {
                mlResults = await this.modelService.analyzeText(text)
            }
            
            const combinedResults = this.combineAnalysisResults(regexResults, mlResults, text)
            
            console.log('Manual analysis result:', combinedResults)
            return {
                success: true,
                result: combinedResults,
                regexEntities: regexResults.length,
                mlEntities: mlResults.length,
                totalEntities: combinedResults.length,
                message: `Analysis complete: ${combinedResults.length} entities found (${regexResults.length} regex, ${mlResults.length} ML)`
            }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    getLastAnalysisResult() {
        return this.lastAnalysisResult
    }

    getLastRegexResult() {
        return this.lastRegexResult
    }

    clearLastAnalysisResult() {
        this.lastAnalysisResult = null
        this.lastRegexResult = null
    }

    // Regex pattern management methods
    getRegexPatterns() {
        return this.regexMatcher.getAllPatterns()
    }

    updateRegexPattern(patternId, enabled) {
        this.regexMatcher.updatePatternStatus(patternId, enabled)
    }

    addCustomRegexPattern(pattern) {
        this.regexMatcher.addPattern(pattern)
    }

    removeRegexPattern(patternId) {
        this.regexMatcher.removePattern(patternId)
    }
}