import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    include: ['tests/domain/**/*.test.ts', 'tests/adapters/**/*.test.ts', 'tests/architecture.test.ts'],
    environment: 'node',
  },
});
