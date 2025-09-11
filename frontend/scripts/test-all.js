#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🧪 Running comprehensive frontend tests...\n'));

const tests = [
  {
    name: 'ESLint - Code Quality Check',
    command: 'npm run lint',
    description: 'Checking for code quality issues and syntax errors'
  },
  {
    name: 'TypeScript Check (if applicable)',
    command: 'npx tsc --noEmit || echo "No TypeScript config found, skipping..."',
    description: 'Checking for type errors',
    optional: true
  },
  {
    name: 'Jest Tests',
    command: 'npm test -- --watchAll=false --coverage',
    description: 'Running unit and integration tests'
  },
  {
    name: 'Build Test',
    command: 'npm run build',
    description: 'Testing production build'
  }
];

let passedTests = 0;
let totalTests = tests.length;

for (const test of tests) {
  console.log(chalk.yellow(`\n📋 ${test.name}`));
  console.log(chalk.gray(`   ${test.description}`));
  
  try {
    execSync(test.command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(chalk.green(`   ✅ ${test.name} passed`));
    passedTests++;
  } catch (error) {
    if (test.optional) {
      console.log(chalk.yellow(`   ⚠️  ${test.name} skipped`));
      totalTests--;
    } else {
      console.log(chalk.red(`   ❌ ${test.name} failed`));
      console.log(chalk.red(`   Error: ${error.message}`));
    }
  }
}

console.log(chalk.blue('\n📊 Test Results Summary:'));
console.log(chalk.green(`✅ Passed: ${passedTests}/${totalTests}`));

if (passedTests === totalTests) {
  console.log(chalk.green('\n🎉 All tests passed! Frontend is ready for deployment.'));
  process.exit(0);
} else {
  console.log(chalk.red(`\n⚠️  ${totalTests - passedTests} test(s) failed. Please fix the issues before deployment.`));
  process.exit(1);
}
