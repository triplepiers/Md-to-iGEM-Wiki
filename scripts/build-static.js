import { execSync } from 'child_process';

const run = (command) => {
  execSync(command, { stdio: 'inherit' });
};

const IGNORE_CONFIG_PATH = 'config/static-export.json';

let failed = false;

try {
  run(`node scripts/gen-fs.js --ignore-config ${IGNORE_CONFIG_PATH}`);
  run('BUILD_CONTEXT=static npm run build');
  run('node scripts/export-static.js');
} catch (error) {
  failed = true;
  console.error('❌ build:static failed:', error instanceof Error ? error.message : error);
} finally {
  try {
    run('node scripts/gen-fs.js');
  } catch (restoreError) {
    failed = true;
    console.error(
      '❌ Failed to restore full constants.ts:',
      restoreError instanceof Error ? restoreError.message : restoreError
    );
  }
}

if (failed) {
  process.exit(1);
}
