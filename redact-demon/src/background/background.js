chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    id: "redact-entities",
    title: "Redact Entities",
    contexts: ["editable"], // Only show on text inputs
    enabled: false // Initially disabled
  })

  console.log('Redact Demon context menu created')
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
  if (request.action === 'UPDATE_CONTEXT_MENU') {
    const { hasPersonEntities, personCount } = request
    
    // Update context menu title and enabled state
    const title = hasPersonEntities 
      ? `Redact Entities (${personCount} found)`
      : "Redact Entities"
    
    chrome.contextMenus.update("redact-entities", {
      title: title,
      enabled: hasPersonEntities
    })
  }
})