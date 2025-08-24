// scripts/sync-resources.js
// Sync Backend/, public/, and node.exe into src-tauri/resources before build

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ROOT = process.cwd();
const SRC_TAURI_RES = path.join(ROOT, 'src-tauri', 'resources');

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function copyFile(src, dst) {
  await ensureDir(path.dirname(dst));
  await fsp.copyFile(src, dst);
}

async function copyDir(srcDir, dstDir) {
  const entries = await fsp.readdir(srcDir, { withFileTypes: true });
  await ensureDir(dstDir);
  for (const e of entries) {
    const s = path.join(srcDir, e.name);
    const d = path.join(dstDir, e.name);
    if (e.isDirectory()) {
      await copyDir(s, d);
    } else if (e.isFile()) {
      await copyFile(s, d);
    }
  }
}

(async () => {
  try {
    // Node binary
    const nodeSrc = path.join(ROOT, 'node.exe');
    const nodeDst = path.join(SRC_TAURI_RES, 'node.exe');
    if (fs.existsSync(nodeSrc)) {
      await copyFile(nodeSrc, nodeDst);
      console.log('Copied node.exe');
    } else {
      console.warn('Warning: node.exe not found at project root.');
    }

    // Backend folder
    const backendSrc = path.join(ROOT, 'Backend');
    const backendDst = path.join(SRC_TAURI_RES, 'Backend');
    if (fs.existsSync(backendSrc)) {
      await copyDir(backendSrc, backendDst);
      console.log('Copied Backend/');
    } else {
      console.warn('Warning: Backend/ folder not found.');
    }

    // public folder
    const publicSrc = path.join(ROOT, 'public');
    const publicDst = path.join(SRC_TAURI_RES, 'public');
    if (fs.existsSync(publicSrc)) {
      await copyDir(publicSrc, publicDst);
      console.log('Copied public/');
    } else {
      console.warn('Warning: public/ folder not found.');
    }
  } catch (err) {
    console.error('sync-resources failed:', err);
    process.exit(1);
  }
})();
