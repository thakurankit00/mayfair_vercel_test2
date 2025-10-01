#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🔧 Building frontend for production with ESLint disabled...');

const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DISABLE_ESLINT_PLUGIN: 'true',
    ESLint_NO_DEV_ERRORS: 'true',
    CI: 'false',
    GENERATE_SOURCEMAP: 'false'
  }
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Frontend build completed successfully!');
  } else {
    console.error('❌ Frontend build failed with code:', code);
    process.exit(code);
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Build process error:', error);
  process.exit(1);
});

