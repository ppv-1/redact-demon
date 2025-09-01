import { useState, useEffect } from 'react'
import { modelService } from '../services/ModelService'

export function useModel() {
  const [isLoading, setIsLoading] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setIsModelLoaded(modelService.isModelLoaded())
  }, [])

  const initializeModel = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await modelService.initializeModel()
      setIsModelLoaded(true)
      return { success: true, message: 'Model loaded successfully! You can now analyze text.' }
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeText = async (text) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await modelService.analyzeText(text)
      return {
        success: true,
        data: result,
        message: `Result: ${result.label} (${(result.score * 100).toFixed(2)}% confidence)`
      }
    } catch (err) {
      setError(err.message)
      return { success: false, message: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    isModelLoaded,
    error,
    initializeModel,
    analyzeText
  }
}