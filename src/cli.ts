// src/cli.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>
// Entry point when running "npx webpack-glsl-minify ..." on the command line

import * as fsAsync from './fsAsync';
import { GlslMinify, GlslOutputFormat } from './minify';
import { nodeDirname, nodeReadFile } from './node';
import glob = require('glob');
import * as path from 'path';
import * as yargs from 'yargs';

interface Arguments {
  files: string | string[];
  ext: string;
  outDir?: string;
  output?: GlslOutputFormat;
  esModule?: boolean;
  stripVersion?: boolean;
  preserveDefines?: boolean;
  preserveUniforms?: boolean;
  preserveVariables?: boolean;
  preserveAll?: boolean;
  nomangle?: string[];
  includesOnly?: boolean;
}

const outputFormats: GlslOutputFormat[] = [ 'object', 'source', 'sourceOnly' ];

// Validate and parse command line arguments. yargs exits and displays help on invalid arguments.
const argv = yargs
  .command('$0 <files..> [options]', 'Minifies one or more GLSL files. Input files may be specified in glob syntax.')
  .demandCommand()
  .options({
    ext: {
      alias: 'e',
      default: '.js',
      describe: 'Extension for output files',
      type: 'string'
    },
    outDir: {
      alias: 'o',
      describe: 'Output base directory. By default, files are output to the same directory as the input .glsl file.',
      type: 'string'
    },
    output: {
      choices: outputFormats,
      describe: 'Output format',
      default: 'object'
    },
    esModule: {
      describe: 'Uses ES modules syntax. Applies to the "object" and "source" output formats.',
      type: 'boolean'
    },
    stripVersion: {
      describe: 'Strips any #version directives',
      type: 'boolean'
    },
    preserveDefines: {
      describe: 'Disables name mangling of #defines',
      type: 'boolean'
    },
    preserveUniforms: {
      describe: 'Disables name mangling of uniforms',
      type: 'boolean'
    },
    preserveVariables: {
      describe: 'Disables name mangling of variables',
      type: 'boolean'
    },
    preserveAll: {
      describe: 'Disables all mangling',
      type: 'boolean'
    },
    nomangle: {
      describe: 'Disables name mangling for a set of keywords',
      type: 'array'
    },
    includesOnly: {
      describe: 'Only processes include directives',
      type: 'boolean'
    }
  })
  .help()
  .argv as any as Arguments;

// Create minifier
const glsl = new GlslMinify({
  output: argv.output,
  esModule: argv.esModule,
  stripVersion: argv.stripVersion,
  preserveDefines: argv.preserveDefines,
  preserveUniforms: argv.preserveUniforms,
  preserveVariables: argv.preserveVariables,
  nomangle: argv.nomangle,
  includesOnly: argv.includesOnly,
}, nodeReadFile, nodeDirname);

// Process input files
if (Array.isArray(argv.files)) {
  for (const pattern of argv.files) {
    processGlob(pattern);
  }
} else {
  processGlob(argv.files);
}

function processGlob(pattern: string): void {
  glob(pattern, (err, matches) => {
    if (err) {
      console.log(err);
      process.exit(-1);
    }

    for (const file of matches) {
      processFile(file).then(() => {}, err => {
        console.log(err);
        process.exit(-1);
      });
    }
  });
}

async function processFile(file: string): Promise<void> {
  // Determine the output file path
  const filename = path.basename(file);
  const outfile = path.resolve(argv.outDir || '', path.dirname(file), filename + argv.ext);
  console.log(`${file} => ${outfile}`);

  // Read the input file and minify it
  const rawGlsl = await nodeReadFile(file);
  const minifiedGlsl = await glsl.executeFileAndStringify(rawGlsl);

  // Write output file, ensuring output directory exists first
  await fsAsync.mkdirp(outfile);
  await fsAsync.writeFile(outfile, minifiedGlsl);
}
