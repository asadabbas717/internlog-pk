import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'development-content-policy',
      apply: 'serve',
      transformIndexHtml(html) {
        // Vite injects CSS into style elements for hot updates in development.
        return html
          .replace("style-src 'self';", "style-src 'self' 'unsafe-inline';")
          .replace(
            "connect-src 'self';",
            "connect-src 'self' ws://127.0.0.1:*;",
          );
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/main.tsx'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        'src/domain/**': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
      },
    },
  },
});
