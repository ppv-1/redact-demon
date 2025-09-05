chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    id: "redact-entities",
    title: "Redact Entities",
    contexts: ["editable"], // Only show on text inputs
    enabled: false // Initially disabled
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "redact-entities") {
    // Send message to content script to redact all entities
    chrome.tabs.sendMessage(tab.id, {
      action: 'REDACT_ENTITIES_FROM_CONTEXT'
    })
  }
})

// Listen for messages from content script to update context menu
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'UPDATE_CONTEXT_MENU') {
    const { hasEntities, entityCount } = request
    
    // Update context menu title and enabled state
    const title = hasEntities 
      ? `Redact Entities (${entityCount} found)`
      : "Redact Entities"
    
    chrome.contextMenus.update("redact-entities", {
      title: title,
      enabled: hasEntities
    })
  }

})