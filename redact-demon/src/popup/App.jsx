import './App.css'
import { useState, useEffect } from 'react'
import { RegexPatternMatcher } from '../utils/regexPatternMatcher.js'

export default function App() {
  const [patterns, setPatterns] = useState([])
  const [patternMatcher, setPatternMatcher] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize the pattern matcher and load saved settings
    const initializePatterns = async () => {
      const matcher = new RegexPatternMatcher()
      
      try {
        // Load saved pattern settings from Chrome storage
        const result = await chrome.storage.sync.get(null)
        
        // Update pattern enabled status based on saved settings
        matcher.getAllPatterns().forEach(pattern => {
          const settingKey = `pattern_${pattern.id}_enabled`
          if (settingKey in result) {
            pattern.enabled = result[settingKey]
          }
        })
        
        setPatternMatcher(matcher)
        setPatterns(matcher.getAllPatterns())
      } catch (error) {
        console.error('Failed to load pattern settings:', error)
        // Fallback to default patterns if loading fails
        setPatternMatcher(matcher)
        setPatterns(matcher.getAllPatterns())
      } finally {
        setIsLoading(false)
      }
    }

    initializePatterns()
  }, [])

  const handlePatternToggle = async (patternId, enabled) => {
    if (patternMatcher) {
      patternMatcher.updatePatternStatus(patternId, enabled)
      setPatterns(patternMatcher.getAllPatterns())
      
      try {
        // Save settings to chrome storage
        await chrome.storage.sync.set({
          [`pattern_${patternId}_enabled`]: enabled
        })

        // Notify content script about the pattern change
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'PATTERN_SETTINGS_UPDATED',
            patternId: patternId,
            enabled: enabled
          })
        }
      } catch (error) {
        console.error('Failed to save pattern setting:', error)
      }
    }
  }

  const handleSelectAll = async () => {
    if (!patternMatcher) return

    patterns.forEach(pattern => {
      patternMatcher.updatePatternStatus(pattern.id, true)
    })
    setPatterns(patternMatcher.getAllPatterns())
    
    try {
      // Save all settings
      const settings = {}
      patterns.forEach(pattern => {
        settings[`pattern_${pattern.id}_enabled`] = true
      })
      await chrome.storage.sync.set(settings)

      // Notify content script about all pattern changes
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'ALL_PATTERNS_UPDATED',
          patterns: patternMatcher.getAllPatterns()
        })
      }
    } catch (error) {
      console.error('Failed to save all pattern settings:', error)
    }
  }

  const handleDeselectAll = async () => {
    if (!patternMatcher) return

    patterns.forEach(pattern => {
      patternMatcher.updatePatternStatus(pattern.id, false)
    })
    setPatterns(patternMatcher.getAllPatterns())
    
    try {
      // Save all settings
      const settings = {}
      patterns.forEach(pattern => {
        settings[`pattern_${pattern.id}_enabled`] = false
      })
      await chrome.storage.sync.set(settings)

      // Notify content script about all pattern changes
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'ALL_PATTERNS_UPDATED',
          patterns: patternMatcher.getAllPatterns()
        })
      }
    } catch (error) {
      console.error('Failed to save all pattern settings:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="popup-container">
        <h2>Redact Demon Settings</h2>
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="popup-container">
      <h2>Redact Demon Settings</h2>
      
      <div className="controls">
        <button onClick={handleSelectAll} className="control-button">
          Select All
        </button>
        <button onClick={handleDeselectAll} className="control-button">
          Deselect All
        </button>
      </div>

      <div className="patterns-container">
        <h3>Redaction Patterns</h3>
        {patterns.map(pattern => (
          <div key={pattern.id} className="pattern-item">
            <label className="pattern-label">
              <input
                type="checkbox"
                checked={pattern.enabled}
                onChange={(e) => handlePatternToggle(pattern.id, e.target.checked)}
                className="pattern-checkbox"
              />
              <div className="pattern-info">
                  
                  <div className="pattern-details">
                    <span className="pattern-title">{pattern.description}</span>
                    <span className="pattern-replacement"> {pattern.replacement}</span>
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}