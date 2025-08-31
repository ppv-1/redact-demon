import Logo from '@/assets/crx.svg'
import { useState } from 'react'
import { pipeline } from '@xenova/transformers'
import './App.css'

function App() {
  const [show, setShow] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [classifier, setClassifier] = useState(null)
  
  const toggle = () => setShow(!show)

  // Initialize the model when component mounts
  const initializeModel = async () => {
    if (!classifier) {
      setIsLoading(true)
      try {
        const pipe = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english')
        setClassifier(pipe)
      } catch (error) {
        console.error('Error loading model:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    if (!classifier) {
      await initializeModel()
    }

    if (classifier) {
      setIsLoading(true)
      try {
        const result = await classifier(input)
        // Display the result back in the input field
        setInput(`Input: "${input}" | Result: ${result[0].label} (${(result[0].score * 100).toFixed(2)}% confidence)`)
      } catch (error) {
        console.error('Error processing text:', error)
        setInput('Error processing text')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="popup-container">
      {show && (
        <div className={`popup-content ${show ? 'opacity-100' : 'opacity-0'}`}>
          <h1>DistilBERT Analyzer</h1>
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to analyze..."
              disabled={isLoading}
              className="text-input"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="submit-button"
            >
              {isLoading ? 'Processing...' : 'Analyze'}
            </button>
          </form>
          {!classifier && !isLoading && (
            <button onClick={initializeModel} className="init-button">
              Load Model
            </button>
          )}
        </div>
      )}
      <button className="toggle-button" onClick={toggle}>
        <img src={Logo} alt="CRXJS logo" className="button-icon" />
      </button>
    </div>
  )
}

export default App