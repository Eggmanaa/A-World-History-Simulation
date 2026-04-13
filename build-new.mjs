import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';

console.log('🔨 Starting build process...');

// Clean and create dist directory
try {
  mkdirSync('dist', { recursive: true });
} catch (e) {}

// Build the frontend with all dependencies bundled
console.log('📦 Building frontend application...');
try {
  await esbuild.build({
    entryPoints: ['index.tsx'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/bundle.js',
    platform: 'browser',
    target: 'es2020',
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.jsx': 'jsx',
      '.js': 'jsx'
    },
    jsx: 'automatic',
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });
  console.log('✅ Frontend built successfully!');
} catch (error) {
  console.error('❌ Frontend build error:', error);
  throw error;
}

// Create optimized HTML
console.log('📄 Creating HTML...');
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Through History: A World History Simulation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body, #root {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        background-color: #0f172a; /* slate-900 */
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/bundle.js"></script>
  </body>
</html>`;

writeFileSync('dist/index.html', html);

// Build the backend API for Cloudflare Workers
console.log('⚙️ Building backend API...');
try {
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/_worker.js',
    platform: 'browser',
    target: 'es2020',
    loader: { '.ts': 'ts' },
    external: ['cloudflare:*']
  });
  console.log('✅ Backend API built successfully!');
} catch (error) {
  console.error('❌ Backend build error:', error);
  throw error;
}

console.log('✅ Build complete!');
console.log('📊 Output directory: dist/');
