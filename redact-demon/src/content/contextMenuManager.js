import { EntityProcessor } from '../utils/entityProcessor.js'

export class ContextMenuManager {
    constructor() {
        this.entityProcessor = new EntityProcessor()
    }

    updateForCurrentInput(currentText, lastAnalysisResult) {
        if (!currentText.trim() || !lastAnalysisResult) {
            this.updateContextMenu(false, 0)
            return
        }

        const namedEntities = this.entityProcessor.getNamedEntities(lastAnalysisResult)
        this.updateContextMenu(namedEntities.length > 0, namedEntities.length)
    }

    updateContextMenu(hasEntities, entityCount) {
        chrome.runtime.sendMessage({
            action: 'UPDATE_CONTEXT_MENU',
            hasPersonEntities: hasEntities,
            personCount: entityCount
        }).catch(error => {
            console.log('Failed to update context menu:', error)
        })
    }
}