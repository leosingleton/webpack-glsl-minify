// src/cli.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>
// Entry point when running "npx webpack-glsl-minify ..." on the command line

import yargs = require('yargs');

interface Arguments {
  files: string[];
  outDir?: string;
  preserveDefines: boolean;
  preserveUniforms: boolean;
  preserveVariables: boolean;
}

// Validate and parse command line arguments. yargs exits and displays help on invalid arguments.
var argv = yargs
  .command('$0 <files..>', 'Minifies one or more GLSL files')
  .demandCommand()
  .options({
    'ext': {
      'alias': 'e',
      'default': '.glsl.js',
      'describe': 'Extension for output files',
      'type': 'string'
    },
    'outDir': {
      'alias': 'o',
      'describe': 'Output base directory. By default, files are output to the same directory as the input .glsl file.',
      'type': 'string'
    },
    'preserveDefines': {
      'describe': 'Disables name mangling of #defines',
      'type': 'boolean'
    },
    'preserveUniforms': {
      'describe': 'Disables name mangling of uniforms',
      'type': 'boolean'
    },
    'preserveVariables': {
      'describe': 'Disables name mangling of variables',
      'type': 'boolean'
    }
  })
  .help()
  .argv as any as Arguments;

console.log(argv);

// Process input files
argv.files.forEach(file => {
  console.log(file);
});
