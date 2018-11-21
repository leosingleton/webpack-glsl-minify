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

/** Map of original unminified names to their minified details */
type UniformMap = { [original: string]: GlslUniform };

/** Output of the GLSL Minifier */
export interface GlslProgram {
  /** Minified GLSL code */
  code: string;

  /** Uniform variable names. Maps the original unminified name to its minified details. */
  map: UniformMap;
}

export interface GlslFile {
  /** Full path of the file (for resolving further @include directives) */
  path?: string;

  /** Unparsed file contents */
  contents: string;
}

/**
 * List of GLSL reserved keywords to avoid mangling. We automatically include any gl_ variables.
 */
let glslReservedKeywords = [
  // Basic types
  'bool', 'double', 'float', 'int', 'uint',

  // Vector types
  'vec2', 'vec3', 'vec4',
  'bvec2', 'bvec3', 'bvec4',
  'dvec2', 'dvec3', 'dvec4',
  'ivec2', 'ivec3', 'ivec4',
  'uvec2', 'uvec3', 'uvec4',

  // Matrix types
  'mat2', 'mat2x2', 'mat2x3', 'mat2x4',
  'mat3', 'mat3x2', 'mat3x3', 'mat3x4',
  'mat4', 'mat4x2', 'mat4x3', 'mat4x4',

  // Other type-related keywords
  'false', 'struct', 'true', 'uniform', 'varying', 'void',

  // Control functions
  'for',

  // Trig functions
  'acos', 'asin', 'atan', 'cos', 'degrees', 'radians', 'sin', 'tan',

  // Exponents and logarithms
  'exp', 'exp2', 'inversesqrt', 'log', 'log2', 'pow', 'sqrt',

  // Clamping and modulus-related funcions
  'abs', 'ceil', 'clamp', 'floor', 'fract', 'max', 'min', 'mod', 'sign',

  // Boolean functions
  'all', 'any', 'equal','greaterThan', 'greaterThanEqual', 'lessThan', 'lessThanEqual', 'not', 'notEqual',

  // Vector functions
  'cross', 'distance', 'dot', 'faceforward', 'length', 'normalize', 'reflect', 'refract',

  // Matrix functions
  'matrixCompMult',
  
  // Interpolation functions
  'mix', 'step', 'smoothstep',

  // Texture functions
  'texture2D', 'textureCube'
];

/**
 * Helper class to minify tokens and track reserved ones
 */
export class TokenMap {
  constructor() {
    // GLSL has many reserved keywords. In order to not minify them, we add them to the token map now.
    this.reserveKeywords(glslReservedKeywords);
  }

  /**
   * The underlying token map itself. Although the data type is GlslUniform, it is used for all tokens, not just
   * uniforms. The type property of GlslUniform is only set for uniforms, however.
   */
  private tokens: UniformMap = {};

  /**
   * Adds keywords to the reserved list to prevent minifying them.
   * @param keywords 
   */
  public reserveKeywords(keywords: string[]): void {
    for (let n = 0; n < keywords.length; n++) {
      let keyword = keywords[n];
      this.tokens[keyword] = { type: undefined, min: keyword };
    }
  }

  /**
   * Number of tokens minified. Used to generate unique names. Although we could be more sophisticated, and count
   * usage, we simply assign names in order. Few shaders have more than 52 variables (the number of single-letter
   * variable names), so simple is good enough.
   */
  private minifiedTokenCount = 0;

  /**
   * Converts a token number to a name
   */
  public static getMinifiedName(tokenCount: number): string {
    let num = tokenCount % 52;
    let offset = (num < 26) ? (num + 65) : (num + 71); // 65 = 'A'; 71 = ('a' - 26)
    let c = String.fromCharCode(offset);

    // For tokens over 52, recursively add characters
    let recurse = Math.floor(tokenCount / 52);
    return (recurse === 0) ? c : (this.getMinifiedName(recurse - 1) + c);
  }

  /**
   * Minifies a token
   * @param name Token name
   * @param uniformType If the token is a uniform, the data type
   * @returns Minified token name
   */
  public minifyToken(name: string, uniformType?: string): string {
    // Special-case any tokens starting with "gl_". They should never be minified.
    if (name.startsWith('gl_')) {
      return name;
    }

    // Check whether the token already has an existing minified value
    let existing = this.tokens[name];
    if (existing) {
      return existing.min;
    }

    // Allocate a new value
    let min = TokenMap.getMinifiedName(this.minifiedTokenCount++);
    this.tokens[name] = {
      min: min,
      type: uniformType
    };

    return min;
  }

  public getUniforms(): UniformMap {
    // Filter only the tokens that have the type field set
    let result: UniformMap = {};
    for (let original in this.tokens) {
      let token = this.tokens[original];
      if (token.type) {
        result[original] = token;
      }
    }

    return result;
  }
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
