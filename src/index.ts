// src/index.ts
// Copyright 2018 Leo C. Singleton IV <leo@leosingleton.com>

import { loader } from 'webpack';
import LoaderContext = loader.LoaderContext;

import { readFile } from 'fs';
import { dirname } from 'path';

export interface GlslUniform {
  /** Variable type, e.g. 'vec3' or 'float' */
  type: string;

  /** Minified variable name */
  min: string;
}

/** Output of the GLSL Minifier */
export interface GlslProgram {
  /** Minified GLSL code */
  code: string;

  /** Uniform variable names. Maps the original unminified name to its minified details. */
  uniforms: { [original: string]: GlslUniform };
}

export interface GlslFile {
  /** Full path of the file (for resolving further @include directives) */
  path: string;

  /** Unparsed file contents */
  contents: string;
}

export class GlslMinify {
  constructor(loader: LoaderContext) {
    this.loader = loader;
  }

  public async execute(content: string): Promise<GlslProgram> {
    return {
      code: 'Hello World!',
      uniforms: {}
    };
  }

  public readFile(filename: string, directory?: string): Promise<GlslFile> {
    return new Promise<GlslFile>((resolve, reject) => {
      // If no directory was provided, use the root GLSL file being included
      if (!directory && this.loader) {
        directory = this.loader.context;
      }

      let readInternal = (path: string) => {
        readFile(path, 'utf-8', (err, data) => {
          if (!err) {
            // Success
            resolve({ path: path, contents: data });
          } else {
            reject(err);
          }
        });
      };

      if (this.loader) {
        // Resolve the file path
        this.loader.resolve(directory, filename, (err: Error, path: string) => {
          if (err) {
            return reject(err);
          }

          this.loader.addDependency(path);
          readInternal(path);
        });
      } else {
        // Special case for unit tests without a Webpack LoaderContext. Just read the file.
        readInternal(filename);
      }
    });
  }

  public async preprocess(content: GlslFile): Promise<string> {
    let output = content.contents;

    // Remove carriage returns. Use newlines only.
    output = output.replace('\r', '');

    // Remove C style comments
    let cStyleRegex = /\/\*[\s\S]*?\*\//g;
    output = output.replace(cStyleRegex, '');

    // Remove C++ style comments
    let cppStyleRegex = /\/\/[^\n]*/g;
    output = output.replace(cppStyleRegex, '\n');

    return output;
  }

  private loader: LoaderContext;
}

export default async function(content: string) {
  let loader = this as LoaderContext;
  loader.async();

  let glsl = new GlslMinify(loader);
  let program = await glsl.execute(content);

  loader.callback(null, 'module.exports = ' + JSON.stringify(program));
};
