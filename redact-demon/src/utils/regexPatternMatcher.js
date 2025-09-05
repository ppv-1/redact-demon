export class RegexPatternMatcher {
    constructor() {
        this.patterns = [
            {
                id: '1',
                description: 'Email Addresses',
                pattern: '\\b[A-Za-z0-9_%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
                replacement: '[EMAIL]',
                enabled: true,
                isRegex: true,
                entityType: 'EMAIL'
            },
            {
                id: '2',
                description: 'Credit Card Numbers',
                pattern: '\\b(?:3(?:0[0-5]|09|[68][0-9])[0-9]{11,14}|4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11}|62[0-9]{14,17})\\b',
                replacement: '[CREDIT_CARD]',
                enabled: true,
                isRegex: true,
                entityType: 'CREDIT_CARD'
            },
            {
                id: "3",
                description: "Singapore NRIC/FIN",
                pattern: "\\b[STFGM]\\d{7}[A-Z]\\b",
                replacement: "[NRIC]",
                enabled: true,
                isRegex: true,
                entityType: "NRIC"
            },
            {
                id: '4',
                description: 'Phone Numbers (SG)',
                pattern: "(?:\\+65[-.\\s]?)?(?:\\(?65\\)?[-.\\s]?)?[689]\\d{3}[-.\\s]?\\d{4}",
                replacement: '[PHONE_NO]',
                enabled: true,
                isRegex: true,
                entityType: 'PHONE'
            },
            {
                id: '5',
                description: 'Website URLs',
                pattern: '\\b(?:(?:https?:|ftp:|sftp:)//)?(?:www\\.)?(?!(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b)[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\\.[a-zA-Z]{2,})+(?::[0-9]{1,5})?(?:/[^\\s]*)?\\b',
                replacement: '[URL]',
                enabled: true,
                isRegex: true,
                entityType: 'URL'
            },
            {
                id: '6',
                description: 'MAC Addresses',
                pattern: '\\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\\b',
                replacement: '[MAC_ADDRESS]',
                enabled: true,
                isRegex: true,
                entityType: 'MAC_ADDRESS'
            },
            {
                id: '7',
                description: 'IPv4 Addresses',
                pattern: '\\b(?<!:)(?<!://)(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?![a-zA-Z])\\b',
                replacement: '[IPV4_ADDRESS]',
                enabled: true,
                isRegex: true,
                entityType: 'IP_ADDRESS'
            },
            {
                id: '8',
                description: 'API/Auth Tokens',
                pattern: '\\b(?:bearer|api_key|auth_token)\\b\\s+([A-Za-z0-9._+\\-\\/]{20,})\\b',
                replacement: '[API_TOKEN]',
                enabled: true,
                isRegex: true,
                entityType: 'API_TOKEN'
            },
            {
                id: '9',
                description: 'AWS Access Keys',
                pattern: '\\b(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}\\b',
                replacement: 'AWS_KEY_REMOVED',
                enabled: true,
                isRegex: true,
                entityType: 'AWS_KEY'
            },
            
        ]
    }

    /**
     * Load pattern settings from Chrome storage
     * @returns {Promise<void>}
     */
    async loadSettings() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            try {
                const result = await chrome.storage.sync.get(null)
                
                this.patterns.forEach(pattern => {
                    const settingKey = `pattern_${pattern.id}_enabled`
                    if (settingKey in result) {
                        pattern.enabled = result[settingKey]
                    }
                })
            } catch (error) {
                console.warn('Failed to load pattern settings:', error)
            }
        }
    }

    /**
     * Apply pattern settings from saved configuration
     * @param {Object} settings - Settings object from Chrome storage
     */
    applySettings(settings) {
        this.patterns.forEach(pattern => {
            const settingKey = `pattern_${pattern.id}_enabled`
            if (settingKey in settings) {
                pattern.enabled = settings[settingKey]
            }
        })
    }

    /**
     * Analyze text for regex pattern matches
     * @param {string} text - Text to analyze
     * @returns {Array} Array of detected entities
     */
    analyzeText(text) {
        const detectedEntities = []

        // Process patterns in order (API tokens before phone numbers as noted)
        const enabledPatterns = this.patterns.filter(p => p.enabled)

        for (const pattern of enabledPatterns) {
            try {
                const regex = new RegExp(pattern.pattern, 'gi')
                let match

                while ((match = regex.exec(text)) !== null) {
                    const matchedText = match[0]
                    const startIndex = match.index
                    const endIndex = startIndex + matchedText.length

                    // Check if this position is already covered by a previous match
                    const isOverlapping = detectedEntities.some(entity =>
                        (startIndex >= entity.start && startIndex < entity.end) ||
                        (endIndex > entity.start && endIndex <= entity.end) ||
                        (startIndex <= entity.start && endIndex >= entity.end)
                    )

                    if (!isOverlapping) {
                        detectedEntities.push({
                            word: matchedText,
                            entity: pattern.entityType,
                            score: 1.0, // High confidence for regex matches
                            start: startIndex,
                            end: endIndex,
                            index: this.getTokenIndex(text, startIndex),
                            source: 'regex',
                            patternId: pattern.id,
                            description: pattern.description,
                            replacement: pattern.replacement
                        })
                    }
                }
            } catch (error) {
                console.warn(`Error processing regex pattern ${pattern.id}:`, error)
            }
        }

        // Sort by start position
        return detectedEntities.sort((a, b) => a.start - b.start)
    }

    /**
     * Convert character position to approximate token index
     * @param {string} text - Full text
     * @param {number} charIndex - Character index
     * @returns {number} Token index
     */
    getTokenIndex(text, charIndex) {
        const beforeText = text.substring(0, charIndex)
        // Simple tokenization - split by whitespace and punctuation
        const tokens = beforeText.split(/\s+/)
        return Math.max(0, tokens.length - 1)
    }

    /**
     * Get pattern by ID
     * @param {string} patternId - Pattern ID
     * @returns {Object|null} Pattern object or null
     */
    getPattern(patternId) {
        return this.patterns.find(p => p.id === patternId) || null
    }

    /**
     * Update pattern enabled status
     * @param {string} patternId - Pattern ID
     * @param {boolean} enabled - Whether pattern is enabled
     */
    updatePatternStatus(patternId, enabled) {
        const pattern = this.getPattern(patternId)
        if (pattern) {
            pattern.enabled = enabled
        }
    }

    /**
     * Get all patterns
     * @returns {Array} All patterns
     */
    getAllPatterns() {
        return [...this.patterns]
    }

    /**
     * Get enabled patterns
     * @returns {Array} Enabled patterns
     */
    getEnabledPatterns() {
        return this.patterns.filter(p => p.enabled)
    }

    /**
     * Add custom pattern
     * @param {Object} pattern - Pattern object
     */
    addPattern(pattern) {
        const maxId = Math.max(...this.patterns.map(p => parseInt(p.id)))
        pattern.id = (maxId + 1).toString()
        this.patterns.push(pattern)
    }

    disablePattern(patternId) {
        const pattern = this.getPattern(patternId)
        if (pattern) {
            pattern.enabled = false
        }
    }
}