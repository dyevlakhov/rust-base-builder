import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    // Everything under test is pure logic: grid maths, the placement rules and
    // the store. Nothing here touches three.js or the DOM, so plain node is
    // enough and the suite stays fast.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
