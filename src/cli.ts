// src/cli.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>
// Entry point when running "npx webpack-glsl-minify ..." on the command line

import yargs = require('yargs');

var argv = yargs
  .command('$0 <files..>', 'Minifies one or more GLSL files, provided as glob patterns')
  .demandCommand()
  .options({
    'ext': {
      'alias': 'e',
      'default': 'js',
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
  .argv;

// TODO: implement
console.log(argv);
