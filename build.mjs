import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Clean and create dist directory
try {
  mkdirSync('dist', { recursive: true });
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

// Build TypeScript files
const files = [
  'index.tsx',
  'App.tsx',
  'constants.ts',
  'types.ts'
];

for (const file of files) {
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

// Build components directory
try {
  mkdirSync('dist/components', { recursive: true });
} catch (e) {}

const componentFiles = readdirSync('components').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
for (const file of componentFiles) {
  await esbuild.build({
    entryPoints: [`components/${file}`],
    bundle: false,
    format: 'esm',
    outdir: 'dist/components',
    outExtension: { '.js': '.js' },
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    jsx: 'automatic',
    plugins: [addJsExtension]
  });
}

// Post-process: Add .js extensions to local imports
function fixImports(filePath) {
  let content = readFileSync(filePath, 'utf8');
  // Fix relative imports: ./file or ../file -> ./file.js or ../file.js
  content = content.replace(/from\s+["'](\.\.?\/.+?)["']/g, (match, path) => {
    if (path.endsWith('.js')) return match;
    return `from "${path}.js"`;
  });
  writeFileSync(filePath, content);
}

// Fix all JS files
for (const file of files) {
  const outFile = file.replace(/\.tsx?$/, '.js');
  fixImports(`dist/${outFile}`);
}

for (const file of componentFiles) {
  const outFile = file.replace(/\.tsx?$/, '.js');
  fixImports(`dist/components/${outFile}`);
}

// Copy HTML
copyFileSync('index.html', 'dist/index.html');

console.log('✅ Build complete!');
