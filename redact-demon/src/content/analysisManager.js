import { RegexPatternMatcher } from '../utils/regexPatternMatcher.js'
import { EntityProcessor } from '../utils/entityProcessor.js'

export class AnalysisManager {
    constructor(textMonitor, modelService) {
        this.textMonitor = textMonitor
        this.modelService = modelService
        this.regexMatcher = new RegexPatternMatcher()
        this.entityProcessor = new EntityProcessor()
        this.debounceTimer = null
        this.lastAnalysisResult = null
        this.lastRegexResult = null
        this.lastGroupedEntities = null
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

            // Step 4: Process and group entities using EntityProcessor
            const namedEntities = this.entityProcessor.getNamedEntities(combinedResults)
            const groupedEntitiesData = this.processGroupedEntities(text, namedEntities)
            this.lastGroupedEntities = groupedEntitiesData

            console.log(`Combined analysis result: ${combinedResults.length} total entities`)
            console.log(`Grouped entities result: ${groupedEntitiesData.totalGroups} entity groups`)
            
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

            // Update context menu with grouped entity count
            this.textMonitor.contextMenuManager.updateForCurrentInput(
                this.textMonitor.getCurrentText(),
                groupedEntitiesData.positions // Pass grouped positions instead of raw entities
            )

            // Show notification with grouped entity count
            this.textMonitor.showEntityNotification(groupedEntitiesData.positions)

        } catch (error) {
            console.error('Analysis failed:', error)
        }
    }

    /**
     * Process entities using EntityProcessor to get grouped counts
     * @param {string} text - Original text
     * @param {Array} entities - Named entities from analysis
     * @returns {Object} Processed entity data with grouped counts
     */
    processGroupedEntities(text, entities) {
        if (entities.length === 0) {
            return {
                totalGroups: 0,
                positions: [],
                entitiesByType: {},
                summary: {}
            }
        }

        // Group entities by type
        const entitiesByType = this.entityProcessor.groupEntitiesByType(entities)
        const allPositions = []
        const summary = {}

        // Process each entity type
        for (const [entityType, typeEntities] of Object.entries(entitiesByType)) {
            // Group consecutive tokens for this entity type
            const nameGroups = this.entityProcessor.groupConsecutiveTokens(typeEntities)
            
            // Get character positions for grouped entities
            const characterPositions = this.entityProcessor.getCharacterPositions(text, nameGroups, entityType)
            
            allPositions.push(...characterPositions)
            summary[entityType] = {
                rawCount: typeEntities.length,
                groupedCount: characterPositions.length,
                positions: characterPositions
            }

            console.log(`${entityType}: ${typeEntities.length} raw entities -> ${characterPositions.length} grouped entities`)
        }

        // Sort positions by start position
        allPositions.sort((a, b) => a.start - b.start)

        return {
            totalGroups: allPositions.length,
            positions: allPositions,
            entitiesByType: entitiesByType,
            summary: summary
        }
    }

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
            
            // Process grouped entities
            const namedEntities = this.entityProcessor.getNamedEntities(combinedResults)
            const groupedEntitiesData = this.processGroupedEntities(text, namedEntities)
            
            console.log('Manual analysis result:', combinedResults)
            console.log('Grouped entities:', groupedEntitiesData)
            
            return {
                success: true,
                result: combinedResults,
                groupedResult: groupedEntitiesData,
                regexEntities: regexResults.length,
                mlEntities: mlResults.length,
                totalEntities: combinedResults.length,
                totalGroups: groupedEntitiesData.totalGroups,
                message: `Analysis complete: ${groupedEntitiesData.totalGroups} entity groups found (${combinedResults.length} total entities)`
            }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    getLastAnalysisResult() {
        return this.lastAnalysisResult
    }

    getLastGroupedEntities() {
        return this.lastGroupedEntities
    }

    getLastRegexResult() {
        return this.lastRegexResult
    }

    clearLastAnalysisResult() {
        this.lastAnalysisResult = null
        this.lastRegexResult = null
        this.lastGroupedEntities = null
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