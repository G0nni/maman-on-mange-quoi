import { configDefaults, defineConfig } from 'vitest/config'

// npm test : tests unitaires. Les tests de règles (tests/rules) ont besoin de l'émulateur,
// ils passent par npm run test:rules (vitest.rules.config.ts).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'tests/rules/**'],
  },
})
