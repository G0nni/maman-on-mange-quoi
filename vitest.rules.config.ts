import { defineConfig } from 'vitest/config'

// Lancé par `npm run test:rules`, à l'intérieur de `firebase emulators:exec` (qui fournit
// FIRESTORE_EMULATOR_HOST). Un seul émulateur partagé : les fichiers passent l'un après l'autre.
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
})
