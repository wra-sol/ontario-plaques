import { cpSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

// Copy worker.js to dist/client as _worker.js
try {
  mkdirSync(join(root, 'dist/client'), { recursive: true });
  cpSync(join(root, 'worker.js'), join(root, 'dist/client/_worker.js'));
  console.log('✓ Copied worker.js to dist/client/_worker.js');
} catch (error) {
  console.error('Error copying worker file:', error);
  process.exit(1);
}

// Copy server bundle to client dist
try {
  cpSync(
    join(root, 'dist/server'),
    join(root, 'dist/client/server'),
    { recursive: true }
  );
  console.log('✓ Copied server bundle to dist/client/server');
} catch (error) {
  console.error('Error copying server bundle:', error);
  process.exit(1);
}

