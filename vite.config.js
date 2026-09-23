import { defineConfig } from 'vite';

const pagesBuild = process.env.GITHUB_PAGES === 'true';
export default defineConfig({
  base: pagesBuild ? '/nonobject-studio/' : '/',
  build: { outDir: 'dist', assetsDir: 'assets' },
});
