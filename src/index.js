#!/usr/bin/env node

import path from 'path';
import { promises as fs } from 'fs';
import { argv } from 'yargs';

import chalk from 'chalk';
import exec from 'await-exec';

const useYarn = (() => {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    return Boolean(userAgent) && userAgent.startsWith('yarn');
  }

  return false;
})();

const PACKAGE_MANAGER = useYarn ? 'yarn' : 'npm';
const INSTALL_CMD = useYarn ? 'yarn add --dev ' : 'npm install --save-dev ';

const RESOURCE_PATH = path.join(__dirname, 'resources');
const PACKAGE_DATA = {
  scripts: {
    build: 'parcel build',
    prepublishOnly: `${PACKAGE_MANAGER} run build`,
    watch: 'parcel watch',
    start: `NODE_ENV=production node lib/index.js`,
    lint: 'eslint ./src/ --ext .js,.jsx',
    fix: 'eslint ./src/ --ext .js,.jsx --fix',
  },
  source: 'src/index.js',
  main: 'lib/index.js',
  files: ['lib/*'],
};

const COPIED_FILES = [
  '.editorconfig',
  '.prettierrc',
  '.eslintrc.js',
  '.parcelrc',
  'jsconfig.json',
  'tsconfig.json',
];
const DEV_PACKAGES = [
  // Parcel
  'parcel',
  'parcel-resolver-project-root',
  'parcel-reporter-auto-exec',

  // Prettier
  'prettier',
  'pretty-quick',

  // Eslint
  'eslint',
  'eslint-plugin-import',
  'eslint-plugin-prettier',
  'eslint-config-airbnb-base',
  'eslint-config-prettier',
];

const run = async () => {
  const projectName = argv._[0];

  console.log(`Creating directory ${chalk.cyan(projectName)}`);
  try {
    await fs.mkdir(projectName);
  } catch {
    console.error(`Unable to create directory ${chalk.red(projectName)}, exiting`);
    process.exit(1);
  }

  process.chdir(projectName);
  await fs.mkdir('src');

  console.log(`Creating base ${chalk.cyan('package.json')}`);
  try {
    await fs.writeFile('package.json', JSON.stringify(PACKAGE_DATA));
  } catch {
    console.error(`Unable to write base package data, exiting`);
    process.exit(1);
  }

  console.log('Installing dev packages');
  for (const dep of DEV_PACKAGES) {
    try {
      console.log(`Installing ${chalk.blue(dep)}`);
      await exec(INSTALL_CMD + dep);
    } catch {
      console.error(`Unable to install ${chalk.red(dep)}, exiting`);
      process.exit(1);
    }
  }

  console.log('Copying configuration files');
  for (const f of COPIED_FILES) {
    try {
      console.log(`Copying ${chalk.blue(f)}`);
      let outPath = path.join('./', f);
      await fs.copyFile(path.join(RESOURCE_PATH, f), outPath);
    } catch (e) {
      console.error(e);
      console.error(`Unable to copy ${chalk.red(f)}, exiting`);
      process.exit(1);
    }
  }

  console.log(chalk.green('Done!'));
};

run().catch((e) => {
  throw new Error(e);
});
