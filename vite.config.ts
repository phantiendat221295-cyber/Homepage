import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Tự động tương thích với cả thư mục 'public' lẫn 'Public' (đề phòng Git trên Windows/Mac không phân biệt hoa/thường khi push lên GitHub/Linux Vercel)
  const rootDir = import.meta.dirname || process.cwd();
  const hasLowercasePublic = fs.existsSync(path.resolve(rootDir, 'public'));
  const hasUppercasePublic = fs.existsSync(path.resolve(rootDir, 'Public'));
  const publicDir = hasLowercasePublic ? 'public' : (hasUppercasePublic ? 'Public' : 'public');

  return {
    base: '/',
    publicDir,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      copyPublicDir: true,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
