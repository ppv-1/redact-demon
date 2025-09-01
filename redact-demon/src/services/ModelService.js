import { pipeline, env } from '@xenova/transformers'

class ModelService {
  constructor() {
    this.classifier = null
    this.isInitialized = false
    this.task = 'sentiment-analysis'
    this.modelName = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    this.configureEnvironment()
  }

  configureEnvironment() {
    env.useBrowserCache = false
    env.allowLocalModels = false
    env.allowRemoteModels = true
    env.remoteURL = 'https://huggingface.co/'
    env.remotePathTemplate = '{model}/resolve/main/'
    env.backends.onnx.wasm.numThreads = 1
    env.backends.onnx.wasm.simd = false
    console.log('Environment configured for browser extension')
  }

  async initializeModel() {
    if (this.isInitialized) {
      return this.classifier
    }

    try {
      console.log('Starting model download...')
      
      const pipe = await pipeline(this.task, this.modelName, {
        revision: 'main',
        cache_dir: null,
        local_files_only: false,
        device: 'cpu',
      })
      
      console.log('Model loaded successfully:', pipe)
      
      // Test the model
      const testResult = await pipe('Hello, world!')
      console.log('Test result:', testResult)
      
      this.classifier = pipe
      this.isInitialized = true
      
      return pipe
    } catch (error) {
      console.error('Error loading model:', error)
      throw new Error(`Failed to load model: ${error.message}`)
    }
  }

  async analyzeText(text) {
    if (!this.isInitialized || !this.classifier) {
      throw new Error('Model not initialized. Please load the model first.')
    }

    if (!text?.trim()) {
      throw new Error('Text input is required')
    }

    try {
      console.log('Analyzing input:', text)
      
      if (typeof this.classifier !== 'function') {
        throw new Error('Model not properly loaded')
      }

      const result = await this.classifier(text)
      console.log('Analysis result:', result)
      
      if (!result || result.length === 0) {
        throw new Error('No result returned from model')
      }

      return result[0]
    } catch (error) {
      console.error('Error processing text:', error)
      throw new Error(`Failed to analyze text: ${error.message}`)
    }
  }

  isModelLoaded() {
    return this.isInitialized && this.classifier !== null
  }
}

// Export singleton instance
export const modelService = new ModelService()