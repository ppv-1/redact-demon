export class NotificationManager {
    constructor() {
        this.currentNotification = null
        this.hideTimer = null
        this.injectStyles()
    }

    injectStyles() {
        if (document.getElementById('redact-demon-notification-styles')) return

        const styleSheet = document.createElement('style')
        styleSheet.id = 'redact-demon-notification-styles'
        styleSheet.textContent = `
            .redact-demon-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff5757;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease-in-out;
                cursor: pointer;
                max-width: 280px;
            }

            .redact-demon-notification.show {
                opacity: 1;
                transform: translateX(0);
            }

            .redact-demon-notification:hover {
                background: #e04848;
                transform: translateX(-5px);
            }

            .redact-demon-notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .redact-demon-notification-text {
                flex: 1;
            }

            .redact-demon-notification-count {
                background: rgba(255, 255, 255, 0.2);
                padding: 2px 6px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }

            .redact-demon-notification-close {
                opacity: 0.7;
                font-size: 18px;
                cursor: pointer;
                padding: 0 4px;
                line-height: 1;
            }

            .redact-demon-notification-close:hover {
                opacity: 1;
            }
        `
        document.head.appendChild(styleSheet)
    }

    showNotification(entityCount, entityTypes = []) {
        // Only show notification if there are entities
        if (entityCount === 0) return

        // Remove existing notification
        this.hideNotification()

        // Create notification element
        const notification = document.createElement('div')
        notification.className = 'redact-demon-notification'
        
        // Create content
        const content = document.createElement('div')
        content.className = 'redact-demon-notification-content'
        
        // Add text
        const text = document.createElement('span')
        text.className = 'redact-demon-notification-text'
        text.textContent = `PII detected`
        
        // Add count
        const count = document.createElement('span')
        count.className = 'redact-demon-notification-count'
        count.textContent = entityCount
        
        // Add close button
        const close = document.createElement('span')
        close.className = 'redact-demon-notification-close'
        close.textContent = '×'
        close.addEventListener('click', (e) => {
            e.stopPropagation()
            this.hideNotification()
        })
        
        // Assemble content
        content.appendChild(text)
        content.appendChild(count)
        content.appendChild(close)
        notification.appendChild(content)
        
        // Add click handler for notification body
        notification.addEventListener('click', () => {
            this.hideNotification()
        })
        
        // Add to page
        document.body.appendChild(notification)
        this.currentNotification = notification
        
        // Show with animation
        requestAnimationFrame(() => {
            notification.classList.add('show')
        })
        
        // Auto-hide after 4 seconds
        this.hideTimer = setTimeout(() => {
            this.hideNotification()
        }, 4000)
        
        console.log(`Notification shown: ${entityCount} entities detected`)
    }

    hideNotification() {
        if (this.hideTimer) {
            clearTimeout(this.hideTimer)
            this.hideTimer = null
        }
        
        if (this.currentNotification) {
            this.currentNotification.classList.remove('show')
            
            setTimeout(() => {
                if (this.currentNotification && this.currentNotification.parentNode) {
                    this.currentNotification.parentNode.removeChild(this.currentNotification)
                }
                this.currentNotification = null
            }, 300) // Wait for animation to complete
        }
    }

    destroy() {
        this.hideNotification()
        const styles = document.getElementById('redact-demon-notification-styles')
        if (styles) {
            styles.remove()
        }
    }
}