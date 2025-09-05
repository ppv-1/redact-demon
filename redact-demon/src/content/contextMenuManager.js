import { EntityProcessor } from '../utils/entityProcessor.js'

export class ContextMenuManager {
    constructor() {
        this.hasEntities = false
        this.entityCount = 0
        this.setupContextMenu()
    }

    setupContextMenu() {
        // Create context menu items when extension loads
        chrome.runtime.sendMessage({
            type: 'CREATE_CONTEXT_MENU'
        })
    }

    updateForCurrentInput(text, groupedEntities) {
        if (!groupedEntities || !Array.isArray(groupedEntities)) {
            this.updateContextMenu(false, 0)
            return
        }

        const entityCount = groupedEntities.length // This is now the grouped count
        this.hasEntities = entityCount > 0
        this.entityCount = entityCount

        this.updateContextMenu(this.hasEntities, entityCount)
        
        console.log(`Context menu updated: ${entityCount} entity groups detected`)
    }

    updateContextMenu(hasEntities, entityCount) {
        chrome.runtime.sendMessage({
            type: 'UPDATE_CONTEXT_MENU',
            hasEntities: hasEntities,
            entityCount: entityCount
        })
    }
}