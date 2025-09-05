import { pipeline, env } from '@xenova/transformers'

class ModelService {
    constructor() {
        this.model = null
        this.tokenizer = null
        this.modelLoaded = false
        this.setupEnvironment()
    }

    setupEnvironment() {
        // Enable local files and set custom model path
        env.allowLocalModels = true
        env.allowRemoteModels = false
        env.localModelPath = chrome.runtime.getURL('public/assets/')
        
        // Set cache directory for Chrome extension
        env.cacheDir = 'models'
        
        console.log('Model path set to:', env.localModelPath)
    }

    async initializeModel() {
        if (this.modelLoaded) {
            console.log('Model already loaded')
            return
        }

        try {
            console.log('Starting model download...')
            
            // Get the extension URL for the model
            const modelPath = 'distilbert-base-multilingual-cased-ner-hrl'
            const fullModelPath = chrome.runtime.getURL(`public/assets/${modelPath}/`)
            
            console.log('Loading model from:', fullModelPath)
            
            // Create pipeline with local model path
            this.model = await pipeline(
                'token-classification',
                modelPath,
                {
                    device: 'wasm',
                    cache_dir: env.cacheDir,
                    local_files_only: true
                }
            )

            this.modelLoaded = true
            console.log('Model loaded successfully')
            
        } catch (error) {
            console.error('Error loading model:', error)
            this.modelLoaded = false
            throw new Error(`Failed to load model: ${error.message}`)
        }
    }

    async analyzeText(text) {
        if (!this.modelLoaded || !this.model) {
            throw new Error('Model not loaded. Please initialize the model first.')
        }

        try {
            const results = await this.model(text)
            
            // Filter and process results
            const processedResults = results
                .filter(result => result.score > 0.8) // Only high confidence predictions
                .map(result => ({
                    word: result.word,
                    entity: result.entity,
                    score: result.score,
                    start: result.start,
                    end: result.end,
                    index: result.index || 0
                }))

            return processedResults
        } catch (error) {
            console.error('Analysis failed:', error)
            return []
        }
    }

    isModelLoaded() {
        return this.modelLoaded && this.model !== null
    }

    getModelInfo() {
        return {
            loaded: this.modelLoaded,
            modelPath: env.localModelPath
        }
    }
}

// Export singleton instance
export const modelService = new ModelService()