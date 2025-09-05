import { pipeline, env } from '@xenova/transformers'

class ModelService {
    constructor() {
        this.model = null
        this.tokenizer = null
        this.modelLoaded = false
        this.isDownloading = false
        this.setupEnvironment()
    }

    setupEnvironment() {
        // Enable both local and remote models
        env.allowLocalModels = true
        env.allowRemoteModels = true
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

        if (this.isDownloading) {
            console.log('Model download already in progress')
            return
        }

        try {
            // First try to load local model
            console.log('Attempting to load local model...')
            await this.tryLoadLocalModel()
            
        } catch (localError) {
            console.log('Local model not found, falling back to remote download...')
            
            try {
                await this.downloadAndLoadRemoteModel()
            } catch (remoteError) {
                console.error('Both local and remote model loading failed:', remoteError)
                throw new Error(`Failed to load model: Local - ${localError.message}, Remote - ${remoteError.message}`)
            }
        }
    }

    async tryLoadLocalModel() {
        const modelPath = 'distilbert-base-multilingual-cased-ner-hrl'
        
        console.log('Loading local model from:', modelPath)
        
        // Try to load with local_files_only = true
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
        console.log('Local model loaded successfully')
        
        this.showModelNotification('Local NER model loaded successfully', 'success')
    }

    async downloadAndLoadRemoteModel() {
        this.isDownloading = true
        
        const remoteModelPath = 'Xenova/distilbert-base-multilingual-cased-ner-hrl'
        
        console.log('Downloading model from Hugging Face:', remoteModelPath)
        
        try {
            // Load from Hugging Face with remote access enabled
            this.model = await pipeline(
                'token-classification',
                remoteModelPath,
                {
                    device: 'wasm',
                    cache_dir: env.cacheDir,
                    local_files_only: false // Allow remote download
                }
            )

            this.modelLoaded = true
            this.isDownloading = false
            console.log('Remote model downloaded and loaded successfully')
            
            // Show success notification for downloaded model
            this.showModelNotification('NER model loaded successfully', 'success')
            
        } catch (error) {
            this.isDownloading = false
            throw error
        }
    }

    showModelNotification(message, type = 'info') {
        // Send message to content script to show notification
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'SHOW_MODEL_NOTIFICATION',
                        message: message,
                        notificationType: type
                    })
                }
            })
        } catch (error) {
            const event = new CustomEvent('redactDemonModelNotification', {
                detail: { message, type }
            })
            document.dispatchEvent(event)
        }
    }

    async analyzeText(text) {
        if (!this.modelLoaded || !this.model) {
            throw new Error('Model not loaded. Please initialize the model first.')
        }

        if (this.isDownloading) {
            console.log('Model still downloading, skipping ML analysis')
            return []
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
        return this.modelLoaded && this.model !== null && !this.isDownloading
    }

    isDownloadingModel() {
        return this.isDownloading
    }

    getModelInfo() {
        return {
            loaded: this.modelLoaded,
            downloading: this.isDownloading,
            modelPath: env.localModelPath
        }
    }
}

// Export singleton instance
export const modelService = new ModelService()