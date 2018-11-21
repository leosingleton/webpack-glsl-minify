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
  map: { [original: string]: GlslUniform };
}

export interface GlslFile {
  /** Full path of the file (for resolving further @include directives) */
  path?: string;

  /** Unparsed file contents */
  contents: string;
}

export class GlslMinify {
  constructor(loader: LoaderContext) {
    this.loader = loader;
  }

  public async execute(content: string): Promise<GlslProgram> {
    let input: GlslFile = { contents: content };

    let pass1 = await this.preprocessPass1(input);

    let pass2 = this.preprocessPass2(pass1);

    return {
      code: pass2,
      map: {}
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

  /**
   * The first pass of the preprocessor removes comments and handles include directives
   */
  public async preprocessPass1(content: GlslFile): Promise<string> {
    let output = content.contents;

    // Remove carriage returns. Use newlines only.
    output = output.replace('\r', '');

    // Remove C style comments
    let cStyleRegex = /\/\*[\s\S]*?\*\//g;
    output = output.replace(cStyleRegex, '');

    // Remove C++ style comments
    let cppStyleRegex = /\/\/[^\n]*/g;
    output = output.replace(cppStyleRegex, '\n');

    // Process @include directive
    let includeRegex = /@include\s(.*)/;
    while (true) {
      // Find the next @include directive
      let match = includeRegex.exec(output);
      if (!match) {
        break;
      }
      let includeFilename = JSON.parse(match[1]);

      // Read the file to include
      let currentPath = content.path ? dirname(content.path) : undefined;
      let includeFile = await this.readFile(includeFilename, currentPath);

      // Parse recursively, as the included file may also have @include directives
      let includeContent = await this.preprocessPass1(includeFile);

      // Replace the @include directive with the file contents
      output = output.replace(includeRegex, includeContent);
    }

    return output;
  }

  /**
   * The second pass of the preprocessor handles define directives
   */
  public preprocessPass2(content: string): string {
    let output = content;

    // Process @define directives
    let defineRegex = /@define\s(\S+)\s(.*)/;
    while (true) {
      // Find the next @define directive
      let match = defineRegex.exec(output);
      if (!match) {
        break;
      }
      let defineMacro = match[1];
      let replaceValue = match[2];

      // Remove the @define line
      output = output.replace(defineRegex, '');

      // Replace all instances of the macro with its value
      //
      // BUGBUG: We start at the beginning of the file, which means we could do replacements prior to the @define
      //   directive. This is unlikely to happen in real code but will cause some weird behaviors if it does.
      let offset = output.indexOf(defineMacro);
      while (offset >= 0 && offset < output.length) {
        // Ensure that the macro isn't appearing within a larger token
        let nextOffset = offset + defineMacro.length;
        let nextChar = output[nextOffset];
        if (/\w/.test(nextChar)) {
          // Ignore. Part of a larger token. Begin searching again at the next non-word.
          do {
            nextChar = output[++nextOffset];
          } while (nextChar && /\w/.test(nextChar));
          offset = nextOffset;
        } else {
          // Replace
          let begin = output.substring(0, offset);
          let end = output.substring(nextOffset);
          output = begin + replaceValue + end;
          offset += replaceValue.length;
        }

        // Advance the offset
        offset = output.indexOf(defineMacro, offset);
      }
    } 

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
