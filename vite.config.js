import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom', globals: true, setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    coverage: { provider: 'v8', reporter: ['text','html','lcov','json-summary'],
      include: ['src/components/**/*.{js,jsx}','src/features/auth/**/*.{js,jsx}','src/services/**/*.{js,jsx}'],
      exclude: ['**/*.test.{js,jsx}'] }
  }
});
