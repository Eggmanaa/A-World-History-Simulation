import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔨 Starting build process...');

// Clean and create dist directory
try {
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/components', { recursive: true });
  mkdirSync('dist/pages', { recursive: true });
} catch (e) {}

// Plugin to add .js extensions to imports
const addJsExtension = {
  name: 'add-js-extension',
  setup(build) {
    build.onResolve({ filter: /^\./ }, args => {
      if (args.path.endsWith('.js') || args.path.endsWith('.tsx') || args.path.endsWith('.ts')) {
        return null;
      }
      return { path: args.path + '.js', external: true };
    });
  }
};

// Build root TypeScript files
console.log('📦 Building root files...');
const rootFiles = [
  'index.tsx',
  'App.tsx',
  'GameApp.tsx',
  'constants.ts',
  'types.ts'
];

for (const file of rootFiles) {
  if (existsSync(file)) {
    await esbuild.build({
      entryPoints: [file],
      bundle: false,
      format: 'esm',
      outdir: 'dist',
      outExtension: { '.js': '.js' },
      loader: { '.tsx': 'tsx', '.ts': 'ts' },
      jsx: 'automatic',
      plugins: [addJsExtension]
    });
  }
}

// Build components directory
console.log('🧩 Building components...');
async function buildDirectory(sourceDir, outputDir) {
  if (!existsSync(sourceDir)) return [];
  
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (e) {}
  
  const files = readdirSync(sourceDir);
  const builtFiles = [];
  
  for (const file of files) {
    const sourcePath = join(sourceDir, file);
    const stat = statSync(sourcePath);
    
    if (stat.isDirectory()) {
      // Recursively build subdirectories
      const subDir = join(outputDir, file);
      const subFiles = await buildDirectory(sourcePath, subDir);
      builtFiles.push(...subFiles);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Build TypeScript files
      const relativePath = join(sourceDir, file);
      await esbuild.build({
        entryPoints: [relativePath],
        bundle: false,
        format: 'esm',
        outdir: outputDir,
        outExtension: { '.js': '.js' },
        loader: { '.tsx': 'tsx', '.ts': 'ts' },
        jsx: 'automatic',
        plugins: [addJsExtension]
      });
      
      const outFile = file.replace(/\.tsx?$/, '.js');
      builtFiles.push(join(outputDir, outFile));
    }
  }
  
  return builtFiles;
}

const componentFiles = await buildDirectory('components', 'dist/components');
const pageFiles = await buildDirectory('pages', 'dist/pages');

// Post-process: Add .js extensions to local imports
console.log('🔧 Fixing imports...');
function fixImports(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    // Fix relative imports: ./file or ../file -> ./file.js or ../file.js
    content = content.replace(/from\s+["'](\.\.?\/.+?)["']/g, (match, path) => {
      if (path.endsWith('.js')) return match;
      return `from "${path}.js"`;
    });
    writeFileSync(filePath, content);
  } catch (e) {
    console.error(`Error fixing imports in ${filePath}:`, e.message);
  }
}

// Fix all JS files
for (const file of rootFiles) {
  const outFile = file.replace(/\.tsx?$/, '.js');
  const filePath = `dist/${outFile}`;
  if (existsSync(filePath)) {
    fixImports(filePath);
  }
}

componentFiles.forEach(fixImports);
pageFiles.forEach(fixImports);

// Copy HTML
console.log('📄 Copying HTML...');
copyFileSync('index.html', 'dist/index.html');

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
}

console.log('✅ Build complete!');
console.log('📊 Output directory: dist/');
