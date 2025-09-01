import './App.css'
import { useState } from 'react'
import { useModel } from '../hooks/useModel'

export default function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const { isLoading, isModelLoaded, initializeModel, analyzeText } = useModel()

  const handleLoadModel = async () => {
    const result = await initializeModel()
    setOutput(result.message)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    if (!isModelLoaded) {
      setOutput('Please load the model first by clicking "Load Model"')
      return
    }

    setOutput('Analyzing text...')
    const result = await analyzeText(input)
    setOutput(result.message)
  }

  return (
    <div className="popup-container">
      <div className="popup-content">
        <h1>Redact Demon</h1>
        
        {!isModelLoaded && !isLoading && (
          <div className="load-section">
            <button onClick={handleLoadModel} className="init-button">
              Load Model
            </button>
            <p className="load-info">Click to download and load the DistilBERT model (first time may take a few minutes)</p>
          </div>
        )}
        
        {(isModelLoaded || isLoading) && (
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to analyze..."
              disabled={isLoading || !isModelLoaded}
              className="text-input"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim() || !isModelLoaded}
              className="submit-button"
            >
              {isLoading ? 'Processing...' : 'Analyze'}
            </button>
          </form>
        )}
        
        <div className="output-container">
          <label htmlFor="output" className="output-label">Output:</label>
          <textarea
            id="output"
            value={output}
            readOnly
            placeholder="Results will appear here..."
            className="output-box"
            rows="4"
          />
        </div>
      </div>
    </div>
  )
}