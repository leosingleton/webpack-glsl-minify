// src/cli.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>
// Entry point when running "npx webpack-glsl-minify ..." on the command line

import { GlslMinify, GlslOutputFormat } from './minify';
import { nodeDirname, nodeReadFile } from './node';
import { writeFileSync } from 'fs';
import glob = require('glob');
import * as path from 'path';
import * as yargs from 'yargs';

interface Arguments {
  files: string | string[];
  ext: string;
  outDir?: string;
  output?: GlslOutputFormat;
  preserveDefines?: boolean;
  preserveUniforms?: boolean;
  preserveVariables?: boolean;
  nomangle?: string[];
}

const outputFormats: GlslOutputFormat[] = [ 'object', 'source', 'sourceOnly' ];

// Validate and parse command line arguments. yargs exits and displays help on invalid arguments.
var argv = yargs
  .command('$0 <files..> [options]', 'Minifies one or more GLSL files. Input files may be specified in glob syntax.')
  .demandCommand()
  .options({
    'ext': {
      alias: 'e',
      default: '.js',
      describe: 'Extension for output files',
      type: 'string'
    },
    'outDir': {
      alias: 'o',
      describe: 'Output base directory. By default, files are output to the same directory as the input .glsl file.',
      type: 'string'
    },
    'output': {
      choices: outputFormats,
      describe: 'Output format',
      default: 'object'
    },
    'preserveDefines': {
      describe: 'Disables name mangling of #defines',
      type: 'boolean'
    },
    'preserveUniforms': {
      describe: 'Disables name mangling of uniforms',
      type: 'boolean'
    },
    'preserveVariables': {
      describe: 'Disables name mangling of variables',
      type: 'boolean'
    },
    'nomangle': {
      describe: 'Disables name mangling for a set of keywords',
      type: 'array'
    }
  })
  .help()
  .argv as any as Arguments;

// Create minifier
let glsl = new GlslMinify({
  output: argv.output,
  preserveDefines: argv.preserveDefines,
  preserveUniforms: argv.preserveUniforms,
  preserveVariables: argv.preserveVariables,
  nomangle: argv.nomangle
}, nodeReadFile, nodeDirname);

// Process input files
if (Array.isArray(argv.files)) {
  argv.files.forEach(pattern => processGlob(pattern));
} else {
  processGlob(argv.files);
}

function processGlob(pattern: string): void {
  glob(pattern, (err, matches) => {
    if (err) {
      console.log(err);
      process.exit(-1);
    }

    matches.forEach(file => {
      processFile(file).then(() => {}, err => {
        console.log(err);
        process.exit(-1);
      });    
    });
  });
}

async function processFile(file: string): Promise<void> {
  // Determine the output file path
  let dirname = argv.outDir ?? path.dirname(file);
  let filename = path.basename(file);
  let outfile = path.resolve(dirname, filename + argv.ext);
  console.log(`${file} => ${outfile}`);

  // Read the input file and minify it
  let rawGlsl = await nodeReadFile(file);
  let minifiedGlsl = await glsl.executeAndStringify(rawGlsl.contents);

  // Write output file
  writeFileSync(outfile, minifiedGlsl);
}
