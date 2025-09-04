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

        const entitiesByType = this.entityProcessor.groupEntitiesByType(namedEntities)
        let redactedText = currentText
        
        for (const [entityType, entities] of Object.entries(entitiesByType)) {
            const nameGroups = this.entityProcessor.groupConsecutiveTokens(entities)
            const characterPositions = this.entityProcessor.getCharacterPositions(redactedText, nameGroups, entityType)
            
            const sortedPositions = characterPositions.sort((a, b) => b.start - a.start)
            
            sortedPositions.forEach(position => {
                const redaction = `[REDACTED_${position.entityType}]`
                const beforeEntity = redactedText.substring(0, position.start)
                const afterEntity = redactedText.substring(position.end)
                redactedText = beforeEntity + redaction + afterEntity
            })
        }

        this.textMonitor.replaceCurrentText(redactedText)
        console.log('All entities redacted successfully')
        
        this.textMonitor.analysisManager.clearLastAnalysisResult()
        this.textMonitor.contextMenuManager.updateContextMenu(false, 0)
    }
}