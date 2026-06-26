import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// @roboforge/core is consumed as TypeScript source via the pnpm workspace link;
// Vite transpiles it through esbuild, so no build step is needed for dev.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
