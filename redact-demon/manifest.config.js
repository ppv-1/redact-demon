import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/lock.png',
  },
  permissions: [
    'sidePanel',
    'contentSettings',
    'storage',
    'activeTab',
    'contextMenus',
  ],
  action: {
    default_icon: {
      48: 'public/lock.png',
    },
    default_popup: 'src/popup/index.html',
  },
  content_scripts: [
    {
      js: ['src/content/main.jsx'],
      matches: [
        '*://gemini.google.com/*',
        '*://chatgpt.com/*',
      ],
    },
    {
      js: ['src/content/textMonitor.js'],
      matches: [
        '*://gemini.google.com/*',
        '*://chatgpt.com/*',
      ],
      run_at: 'document_end'
    }
  ],
  background: {
    "service_worker": "src/background/background.js"
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  web_accessible_resources: [
    {
      resources: [
        'public/assets/distilbert-base-multilingual-cased-ner-hrl/*',
        'public/assets/distilbert-base-multilingual-cased-ner-hrl/onnx/*'
      ],
      matches: [
        '*://gemini.google.com/*',
        '*://chatgpt.com/*',
      ],
    },
  ],
})
