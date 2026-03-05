import { execSync } from 'child_process';

const isStatic = () => {
  const raw = process.env.BUILD_CONTEXT || process.env.BUILD_STATIC || '';
  const value = String(raw).toLowerCase();
  return value === 'static' || value === '1' || value === 'true' || value === 'yes';
};

if (isStatic()) {
  console.log('[prebuild] skipped (static build context detected).');
  process.exit(0);
}

const run = (command) => {
  execSync(command, { stdio: 'inherit' });
};

run('npm run gen');
run('npm run normalize-links');
