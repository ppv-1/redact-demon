import './App.css'
import { useState, useEffect } from 'react'
import { pipeline, env } from '@xenova/transformers'

export default function App() {
    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [classifier, setClassifier] = useState(null)
    const task = 'sentiment-analysis';
    const modelName = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
    
    useEffect(() => {
        // Configure transformers.js for browser extension environment
        env.useBrowserCache = false;
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        env.remoteURL = 'https://huggingface.co/';
        env.remotePathTemplate = '{model}/resolve/main/';
        
        // IMPORTANT: Disable Web Workers for browser extensions
        env.backends.onnx.wasm.numThreads = 1;
        env.backends.onnx.wasm.simd = false;
        
        console.log('Environment configured for browser extension');
    }, []);

    // Initialize the model when component mounts
    const initializeModel = async () => {
      if (!classifier) {
        setIsLoading(true)
        setOutput('Loading model... This may take a few minutes on first load.');
        try {
          console.log('Starting model download...')
          
          // Create pipeline with specific options for browser extension
          const pipe = await pipeline(task, modelName, {
            revision: 'main',
            cache_dir: null,
            local_files_only: false,
            device: 'cpu',
          });
          
          console.log('Model loaded successfully:', pipe)
          console.log('Pipeline type:', typeof pipe)
          const result = await pipe('Hello, world!')
          console.log(result)
          setClassifier(() => pipe)
          setOutput('Model loaded successfully! You can now analyze text.')
        } catch (error) {
          console.error('Error loading model:', error)
          setOutput(`Error loading model: ${error.message}`)
        } finally {
          setIsLoading(false)
        }
      }
    }
  
    const handleSubmit = async (e) => {
      e.preventDefault()
      if (!input.trim()) return
  
      if (!classifier) {
        setOutput('Please load the model first by clicking "Load Model"')
        return
      }
  
      setIsLoading(true)
      setOutput('Analyzing text...')
      try {
        console.log('Analyzing input:', input)
        
        // Make sure classifier is a function before calling
        if (typeof classifier === 'function') {
          const result = await classifier(input)
          console.log('Analysis result:', result)
          
          if (result && result.length > 0) {
            const prediction = result[0]
            setOutput(`Result: ${prediction.label} (${(prediction.score * 100).toFixed(2)}% confidence)`)
          } else {
            setOutput('No result returned from model.')
          }
        } else {
          console.error('Classifier is not a function:', typeof classifier)
          setOutput('Model not properly loaded. Please try loading again.')
        }
      } catch (error) {
        console.error('Error processing text:', error)
        setOutput(`Error processing text: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }
  
    return (
      <div className="popup-container">
        <div className="popup-content">
          <h1>Redact Demon</h1>
          
          {/* Show load button first */}
          {!classifier && !isLoading && (
            <div className="load-section">
              <button onClick={initializeModel} className="init-button">
                Load Model
              </button>
              <p className="load-info">Click to download and load the DistilBERT model (first time may take a few minutes)</p>
            </div>
          )}
          
          {/* Show form only after model is loaded */}
          {(classifier || isLoading) && (
            <form onSubmit={handleSubmit} className="input-form">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to analyze..."
                disabled={isLoading || !classifier}
                className="text-input"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim() || !classifier}
                className="submit-button"
              >
                {isLoading ? 'Processing...' : 'Analyze'}
              </button>
            </form>
          )}
          
          {/* Output box */}
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