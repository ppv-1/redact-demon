import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  permissions: [
    'sidePanel',
    'contentSettings',
    'storage',
    'activeTab',
  ],
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  content_scripts: [
    {
      js: ['src/content/main.jsx'],
      matches: ['https://*/*'],
    },
    {
      js: ['src/content/textMonitor.js'],
        matches: ['<all_urls>'],
        run_at: 'document_end'
    }
],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})
