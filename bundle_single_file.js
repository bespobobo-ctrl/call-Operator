import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// Read built dist files
let indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// Find asset files in dist/assets
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  let cssContent = '';
  let jsContent = '';

  files.forEach(file => {
    if (file.endsWith('.css')) {
      cssContent += fs.readFileSync(path.join(assetsDir, file), 'utf-8') + '\n';
    } else if (file.endsWith('.js')) {
      jsContent += fs.readFileSync(path.join(assetsDir, file), 'utf-8') + '\n';
    }
  });

  // Replace link style tag with inline style
  indexHtml = indexHtml.replace(/<link rel="stylesheet"[^>]*href="\/assets\/[^"]*"[^>]*>/g, () => `<style>${cssContent}</style>`);
  indexHtml = indexHtml.replace(/<script type="module"[^>]*src="\/assets\/[^"]*"[^>]*><\/script>/g, () => `<script type="module">${jsContent}</script>`);
}

// Save standalone HTML file
fs.writeFileSync(path.join(publicDir, 'AI_Call_Center_Planshet.html'), indexHtml);
fs.writeFileSync(path.join(distDir, 'AI_Call_Center_Planshet.html'), indexHtml);

console.log("Standalone HTML App created successfully at public/AI_Call_Center_Planshet.html!");
