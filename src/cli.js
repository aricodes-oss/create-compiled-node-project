#!/usr/bin/env node

// This is just a simple wrapper to avoid having the shell bang in the module
import run from './index';

run().catch(e => {throw new Error(e)});
