import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();

// Helper to recursively add directory files to ZIP
function addDirToZip(dirPath, zipFolder) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.vercel' && file !== 'dist') {
        const subFolder = zipFolder.folder(file);
        addDirToZip(fullPath, subFolder);
      }
    } else {
      if (file !== 'ai-call-center-offline.zip' && !file.endsWith('.tmp')) {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(file, content);
      }
    }
  }
}

// Add root files and directories
const projectRoot = path.resolve('.');
const files = ['index.html', 'package.json', 'vite.config.js', 'README.md', 'vercel.json'];

files.forEach(f => {
  if (fs.existsSync(path.join(projectRoot, f))) {
    zip.file(f, fs.readFileSync(path.join(projectRoot, f)));
  }
});

if (fs.existsSync(path.join(projectRoot, 'src'))) {
  addDirToZip(path.join(projectRoot, 'src'), zip.folder('src'));
}

if (fs.existsSync(path.join(projectRoot, 'public'))) {
  const publicZip = zip.folder('public');
  const pubFiles = fs.readdirSync(path.join(projectRoot, 'public'));
  for (const pf of pubFiles) {
    if (pf !== 'ai-call-center-offline.zip') {
      const fullPath = path.join(projectRoot, 'public', pf);
      if (fs.statSync(fullPath).isDirectory()) {
        addDirToZip(fullPath, publicZip.folder(pf));
      } else {
        publicZip.file(pf, fs.readFileSync(fullPath));
      }
    }
  }
}

// Also add a ready-to-run instructions file
zip.file('QUICK_START_OFFLINE.txt', `========================================================================
AI Call Center — Planshet & Desktop Avtonom Ishlatish Qo'llanmasi
========================================================================

1. BRAUZERDA O'CHMASDAN O'RNATISH (PWA):
   - Ushbu loyihani https://call-operator-two.vercel.app/ sayti orqali oching.
   - Yuqori o'ng burchakdagi "Planshetga Yuklab Olish" tugmasini bosing.
   - Planshet ekranida "Bosh ekranga qo'shish" tugmasi orqali alohida ilova shaklida o'rnating.

2. MANBA KODI ORQALI LOKAL ISHLATISH:
   - Node.js o'rnatilgan bo'lsa, konsolda terminalni oching.
   - 'npm install' buyrug'ini bosing.
   - 'npm run dev' buyrug'i orqali lokal dev-serverni ishga tushiring (http://localhost:3000).

3. QO'NG'IROQLAR VA OPERATORLAR:
   - Gemini Live 2.0 API orqali jonli muloqot va ovozli suhbat.
   - 5 ta operator liniyalari va supervisor boshqaruv paneli tayyor.
`);

zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  
  fs.writeFileSync(path.join(publicDir, 'ai-call-center-offline.zip'), content);
  console.log("ZIP package generated successfully at public/ai-call-center-offline.zip!");
});
