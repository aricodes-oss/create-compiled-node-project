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
    build: 'babel src --out-dir lib --copy-files',
    prepublishOnly: `${PACKAGE_MANAGER} run build`,
    dev: 'babel-node src/index.js',
    start: `${PACKAGE_MANAGER} run build && NODE_ENV=production lib/index.js`,
    lint: 'pretty-quick --check src/',
  },
  main: 'lib/index.js',
};

const COPIED_FILES = ['.babelrc.json', '.editorconfig', '.gitignore', '.prettierrc'];
const DEV_PACKAGES = [
  '@babel/cli',
  '@babel/core',
  '@babel/node',
  '@babel/preset-env',
  'prettier',
  'pretty-quick',
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
      await fs.copyFile(path.join(RESOURCE_PATH, f), path.join('./', f));
    } catch {
      console.error(`Unable to copy ${chalk.red(f)}, exiting`);
      process.exit(1);
    }
  }

  console.log(chalk.green('Done!'));
};

run().catch((e) => {
  throw new Error(e);
});
