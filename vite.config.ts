import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ root: 'apps/playtest', base: './', server: { port: 4173, strictPort: true }, build: { outDir: '../../dist', emptyOutDir: true, rolldownOptions: { input: {main:resolve('apps/playtest/index.html'),legacy:resolve('apps/playtest/legacy.html')} } } });
