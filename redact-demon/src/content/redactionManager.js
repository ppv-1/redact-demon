import { EntityProcessor } from '../utils/entityProcessor.js'

export class RedactionManager {
    constructor(textMonitor) {
        this.textMonitor = textMonitor
        this.entityProcessor = new EntityProcessor()
    }

    redactAllEntities() {
        if (!this.textMonitor.lastAnalysisResult || !this.textMonitor.currentInput) {
            console.log('No analysis result or current input to redact')
            return
        }

        const currentText = this.textMonitor.getCurrentText()
        const namedEntities = this.entityProcessor.getNamedEntities(this.textMonitor.lastAnalysisResult)
        
        if (namedEntities.length === 0) {
            console.log('No named entities to redact')
            return
        }

        console.log(`Starting redaction of ${namedEntities.length} entities`)
        
        // Get all character positions for all entities
        const allPositions = this.getAllEntityPositions(currentText, namedEntities)
        
        if (allPositions.length === 0) {
            console.log('No entity positions found to redact')
            return
        }

        // Perform redaction with position tracking
        const redactedText = this.performRedactionWithPositionTracking(currentText, allPositions)

        this.textMonitor.replaceCurrentText(redactedText)
        console.log('All entities redacted successfully')
        
        // Clear analysis results
        this.textMonitor.analysisManager.clearLastAnalysisResult()
        this.textMonitor.contextMenuManager.updateContextMenu(false, 0)
    }

    /**
     * Get character positions for all entities
     * @param {string} text - Original text
     * @param {Array} entities - Named entities
     * @returns {Array} Array of position objects
     */
    getAllEntityPositions(text, entities) {
        const entitiesByType = this.entityProcessor.groupEntitiesByType(entities)
        const allPositions = []
        
        for (const [entityType, typeEntities] of Object.entries(entitiesByType)) {
            const nameGroups = this.entityProcessor.groupConsecutiveTokens(typeEntities)
            const characterPositions = this.entityProcessor.getCharacterPositions(text, nameGroups, entityType)
            allPositions.push(...characterPositions)
        }
        
        // Sort by start position (ascending) for proper processing
        return allPositions.sort((a, b) => a.start - b.start)
    }

    /**
     * Perform redaction while tracking position shifts
     * @param {string} originalText - Original text
     * @param {Array} positions - Array of entity positions
     * @returns {string} Redacted text
     */
    performRedactionWithPositionTracking(originalText, positions) {
        let result = originalText
        let totalShift = 0 // Track cumulative position shift
        
        // Process positions from left to right
        for (let i = 0; i < positions.length; i++) {
            const position = positions[i]
            
            // Adjust position based on previous replacements
            const adjustedStart = position.start + totalShift
            const adjustedEnd = position.end + totalShift
            
            // Get replacement text
            let replacement
            if (position.source === 'regex' && position.replacement) {
                replacement = position.replacement
            } else {
                replacement = `[REDACTED_${position.entityType}]`
            }
            
            // Verify the text at the adjusted position matches what we expect
            const originalEntityText = originalText.substring(position.start, position.end)
            const currentEntityText = result.substring(adjustedStart, adjustedEnd)
            
            // Only proceed if the text matches (safety check)
            if (this.textMatches(originalEntityText, currentEntityText)) {
                // Perform replacement
                const beforeEntity = result.substring(0, adjustedStart)
                const afterEntity = result.substring(adjustedEnd)
                result = beforeEntity + replacement + afterEntity
                
                // Calculate shift for this replacement
                const originalLength = position.end - position.start
                const newLength = replacement.length
                const currentShift = newLength - originalLength
                totalShift += currentShift
                
                console.log(`Redacted ${position.entityType}: "${originalEntityText}" -> "${replacement}" (shift: ${currentShift})`)
            } else {
                console.warn(`Position mismatch for ${position.entityType}. Expected: "${originalEntityText}", Found: "${currentEntityText}"`)
            }
        }
        
        return result
    }

    /**
     * Check if two text strings match (with some flexibility for whitespace)
     * @param {string} text1 - First text
     * @param {string} text2 - Second text
     * @returns {boolean} Whether texts match
     */
    textMatches(text1, text2) {
        // Direct match
        if (text1 === text2) return true
        
        // Case insensitive match
        if (text1.toLowerCase() === text2.toLowerCase()) return true
        
        // Normalized whitespace match
        const normalize = (str) => str.replace(/\s+/g, ' ').trim()
        if (normalize(text1) === normalize(text2)) return true
        
        return false
    }

    /**
     * Redact only specific entity types
     * @param {Array} entityTypes - Array of entity types to redact
     */
    redactSpecificEntityTypes(entityTypes) {
        if (!this.textMonitor.lastAnalysisResult || !this.textMonitor.currentInput) {
            console.log('No analysis result or current input to redact')
            return
        }

        const currentText = this.textMonitor.getCurrentText()
        const allEntities = this.entityProcessor.getNamedEntities(this.textMonitor.lastAnalysisResult)
        
        // Filter entities by specified types
        const targetEntities = allEntities.filter(entity => {
            const entityType = this.entityProcessor.getEntityType(entity.entity)
            return entityTypes.includes(entityType)
        })

        if (targetEntities.length === 0) {
            console.log('No target entities found to redact')
            return
        }

        console.log(`Redacting ${targetEntities.length} entities of types: ${entityTypes.join(', ')}`)
        
        // Get positions for target entities only
        const targetPositions = this.getAllEntityPositions(currentText, targetEntities)
        
        // Perform redaction with position tracking
        const redactedText = this.performRedactionWithPositionTracking(currentText, targetPositions)

        this.textMonitor.replaceCurrentText(redactedText)
        console.log(`Specific entity types redacted: ${entityTypes.join(', ')}`)
        
        // Update analysis results (remove redacted entities)
        this.updateAnalysisAfterPartialRedaction(entityTypes)
    }

    /**
     * Update analysis results after partial redaction
     * @param {Array} redactedEntityTypes - Entity types that were redacted
     */
    updateAnalysisAfterPartialRedaction(redactedEntityTypes) {
        if (!this.textMonitor.lastAnalysisResult) return
        
        const remainingEntities = this.textMonitor.lastAnalysisResult.filter(entity => {
            const entityType = this.entityProcessor.getEntityType(entity.entity)
            return !redactedEntityTypes.includes(entityType)
        })
        
        this.textMonitor.analysisManager.lastAnalysisResult = remainingEntities
        
        // Update context menu
        this.textMonitor.contextMenuManager.updateForCurrentInput(
            this.textMonitor.getCurrentText(),
            remainingEntities
        )
    }

    /**
     * Alternative redaction method using reverse order (for comparison/backup)
     * This processes entities from right to left to avoid position shifts
     */
    redactAllEntitiesReverse() {
        if (!this.textMonitor.lastAnalysisResult || !this.textMonitor.currentInput) {
            console.log('No analysis result or current input to redact')
            return
        }

        const currentText = this.textMonitor.getCurrentText()
        const namedEntities = this.entityProcessor.getNamedEntities(this.textMonitor.lastAnalysisResult)
        
        if (namedEntities.length === 0) {
            console.log('No named entities to redact')
            return
        }

        // Get all positions and sort in reverse order (right to left)
        const allPositions = this.getAllEntityPositions(currentText, namedEntities)
        const sortedPositions = allPositions.sort((a, b) => b.start - a.start)
        
        let redactedText = currentText
        
        // Process from right to left (no position shift issues)
        sortedPositions.forEach(position => {
            let replacement
            if (position.source === 'regex' && position.replacement) {
                replacement = position.replacement
            } else {
                replacement = `[REDACTED_${position.entityType}]`
            }
            
            const beforeEntity = redactedText.substring(0, position.start)
            const afterEntity = redactedText.substring(position.end)
            redactedText = beforeEntity + replacement + afterEntity
            
            console.log(`Redacted ${position.entityType}: "${position.name}" -> "${replacement}"`)
        })

        this.textMonitor.replaceCurrentText(redactedText)
        console.log('All entities redacted successfully (reverse method)')
        
        // Clear analysis results
        this.textMonitor.analysisManager.clearLastAnalysisResult()
        this.textMonitor.contextMenuManager.updateContextMenu(false, 0)
    }
}