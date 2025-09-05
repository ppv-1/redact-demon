export class EntityProcessor {
    getNamedEntities(analysisResult) {
        if (!analysisResult || !Array.isArray(analysisResult)) return []
        
        return analysisResult.filter(entity => 
            entity.entity && 
            entity.entity !== 'O' && 
            !entity.entity.includes('MISC')
        )
    }

    getEntityType(entityLabel) {
        // Handle regex entity types (they're already clean)
        if (!entityLabel.includes('-')) {
            return entityLabel
        }
        
        // Handle ML model entity types (B- and I- prefixes)
        if (entityLabel.startsWith('B-') || entityLabel.startsWith('I-')) {
            return entityLabel.substring(2)
        }
        return entityLabel
    }

    groupEntitiesByType(entities) {
        const grouped = {}
        
        entities.forEach(entity => {
            const entityType = this.getEntityType(entity.entity)
            if (!grouped[entityType]) {
                grouped[entityType] = []
            }
            grouped[entityType].push(entity)
        })
        
        return grouped
    }

    groupConsecutiveTokens(entities) {
        if (entities.length === 0) return []
        
        const sorted = entities.sort((a, b) => (a.start || a.index) - (b.start || b.index))
        const groups = []
        let currentGroup = [sorted[0]]
        
        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i]
            const previous = sorted[i - 1]
            
            // For regex entities, use character positions
            if (current.source === 'regex' && previous.source === 'regex') {
                if (current.start <= previous.end + 2) { // Allow small gaps
                    currentGroup.push(current)
                } else {
                    groups.push(currentGroup)
                    currentGroup = [current]
                }
            }
            // For ML entities, use token indices and B-/I- logic
            else if (current.source === 'ml' && previous.source === 'ml') {
                const isConsecutive = current.index === previous.index + 1
                const isValidSequence = 
                    (previous.entity.startsWith('B-') && current.entity.startsWith('I-')) ||
                    (previous.entity.startsWith('I-') && current.entity.startsWith('I-'))
                
                if (isConsecutive && isValidSequence) {
                    currentGroup.push(current)
                } else {
                    groups.push(currentGroup)
                    currentGroup = [current]
                }
            }
            // Mixed sources - start new group
            else {
                groups.push(currentGroup)
                currentGroup = [current]
            }
        }
        groups.push(currentGroup)
        
        return groups
    }

    getCharacterPositions(originalText, nameGroups, entityType) {
        const positions = []
        
        for (const group of nameGroups) {
            // Handle regex entities (already have character positions)
            if (group[0].source === 'regex') {
                const entity = group[0] // Regex entities are typically single matches
                positions.push({
                    start: entity.start,
                    end: entity.end,
                    name: entity.word,
                    entityType: entityType,
                    tokens: group,
                    source: 'regex',
                    replacement: entity.replacement
                })
            }
            // Handle ML entities (need to find character positions)
            else {
                // Reconstruct the full entity name from subword tokens
                const fullEntity = this.reconstructEntityFromTokens(group)
                const charPosition = this.findEntityInText(originalText, fullEntity, group[0].word)
                
                if (charPosition !== -1) {
                    positions.push({
                        start: charPosition,
                        end: charPosition + fullEntity.length,
                        name: fullEntity,
                        entityType: entityType,
                        tokens: group,
                        source: 'ml'
                    })
                }
            }
        }
        
        return positions
    }

    findEntityInText(text, fullEntity, firstToken) {
        let position = text.indexOf(fullEntity)
        if (position !== -1) return position
        
        position = text.toLowerCase().indexOf(fullEntity.toLowerCase())
        if (position !== -1) return position
        
        const cleanFirstToken = firstToken.replace(/^##/, '')
        const tokenPositions = []
        let searchPos = 0
        
        while (searchPos < text.length) {
            const pos = text.toLowerCase().indexOf(cleanFirstToken.toLowerCase(), searchPos)
            if (pos === -1) break
            
            const beforeChar = pos > 0 ? text[pos - 1] : ' '
            const afterChar = pos + cleanFirstToken.length < text.length ? 
                             text[pos + cleanFirstToken.length] : ' '
            
            if (/\s/.test(beforeChar) && (/\s/.test(afterChar) || /[.,!?;:]/.test(afterChar))) {
                tokenPositions.push(pos)
            }
            
            searchPos = pos + 1
        }
        
        return tokenPositions.length > 0 ? tokenPositions[0] : -1
    }

    /**
     * Reconstruct entity name from subword tokens
     * @param {Array} tokens - Array of token objects
     * @returns {string} Reconstructed entity name
     */
    reconstructEntityFromTokens(tokens) {
        let result = ''
        
        for (const token of tokens) {
            if (token.word.startsWith('##')) {
                // Subword token - append without space
                result += token.word.substring(2)
            } else {
                // Regular token - add with space if not first
                if (result) result += ' '
                result += token.word
            }
        }
        
        return result
    }
}