#!/usr/bin/env node

import path from 'path';

// This is just a simple wrapper to avoid having the shell bang in the module
import run from path.join(__dirname, 'index');

run().catch(e => {throw new Error(e)});
