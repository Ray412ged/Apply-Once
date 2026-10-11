import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  test: {
    environment: 'node',
    globals: true,
    // Only the adapter suites under __tests__ are discovered directly.
    // The original *.test.js files (engine.test.js, improveNext.test.js,
    // CommandCenter.test.js, resumeGenerator.test.js) stay where they are
    // as the actual test logic — the adapters import and run them with
    // real describe/it/expect so vitest can report pass/fail. This avoids
    // vitest separately "discovering" the original files (which have no
    // it()/test() blocks of their own) and reporting a false empty-suite
    // warning or failure for each of them.
    include: ['src/__tests__/**/*.test.js'],
  },
});