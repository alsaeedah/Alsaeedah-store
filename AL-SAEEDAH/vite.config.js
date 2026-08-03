import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const resolveSharedDepsPlugin = () => ({
  name: 'resolve-shared-deps',
  resolveId(source, importer) {
    // If the import comes from the shared directory and is a bare specifier (e.g. 'react', 'firebase/firestore')
    if (importer && importer.includes(path.normalize('/shared/').replace(/\\/g, '/')) && !source.startsWith('.') && !source.startsWith('/')) {
      // Resolve it as if it was imported from the AL-SAEEDAH root
      return this.resolve(source, path.resolve(__dirname, 'index.html'), { skipSelf: true })
        .then(resolved => resolved || null);
    }
    return null;
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), resolveSharedDepsPlugin()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
