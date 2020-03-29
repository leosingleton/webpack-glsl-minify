# GLSL Preprocessor, Minifier, and Webpack Loader
[![Build Status](https://dev.azure.com/leosingleton/webpack-glsl-minify/_apis/build/status/leosingleton.webpack-glsl-minify?branchName=master)](https://dev.azure.com/leosingleton/webpack-glsl-minify/_build/latest?definitionId=1?branchName=master)
[![npm version](https://badge.fury.io/js/webpack-glsl-minify.svg)](https://badge.fury.io/js/webpack-glsl-minify)

webpack-glsl-minify is a loader for Webpack that handles GLSL files. In addition to simply loading the GLSL program
into a JavaScript string, it also has a preprocessor which executes at compile time, and a minifier which shrinks the
GLSL program before embedding it in JavaScript.

## Install
```
npm install --save-dev webpack-glsl-minify
```

## Usage
### Webpack Configuration
To use, add the following to your webpack.js config file:

```javascript
module: {
  rules: [
    {
      test: /\.glsl$/,
      use: 'webpack-glsl-minify'
    }
  ]
},
resolve: {
  extensions: [ '.glsl' ]
}
```

### GLSL Preprocessor
The preprocessor uses an `@` symbol to distinguish commands executed at Webpack compile time versus shader compile time.
The following commands are supported:

#### include Directive
Includes another GLSL file. Example:
```
@include "../path/another-file.glsl"
```

#### define Directive
Defines a macro which will be substituted elsewhere in the code. Example:
```
@define PI 3.1415
// ....
float angle = 2.0 * PI;
```

Note that `@define` is not a replacement for `#define`. For minification purposes, it is often better to let the shader
compiler do the macro substitution instead of the Webpack compiler.

#### nomangle Directive
Disables name mangling on one or more symbols. Example:
```
@nomangle symbol1 symbol2
```

#### const Directive
Defines a constant variable with a unique substitution value that can be used to search-and-replace to initialize the
constant. Example:
```
@const int my_int
```
will produce
```glsl
const int A=$0$;
```
and the mapping from `my_int` to the substitution value `$0$` will be returned in the output.

### Minification
The following minification optimizations are performed:

* Removal of comments and whitespace. Both C-style `/* Comment */` and C++-style `// Comment` are supported.
* Shortening floating point numbers. `1.0` becomes `1.`
* Mangling symbol names. All functions, variables, parameters, and uniforms are renamed to short names. Built-in GLSL
  functions and variables begining with `gl_` are automatically excluded. Attributes and varying variables are also
  excluded, as the names must be consistent across multiple shaders. Additional symbols may be excluded with the
  `@nomangle` directive.

### Output
By default, an object is exported via JavaScript containing the source code and a map of the mangled uniforms and
constants:
```javascript
module.exports = {
  sourceCode: "uniform vec3 A;uniform float B;/* ... More minified GLSL code here */",
  uniforms: { // Map of minified uniform variables
    uniform1: {             // Unminified uniform name
      variableName: "A",    // Minified uniform name
      variableType: "vec3"  // Type of the uniform
    },
    uniform2: {
      variableName: "B",
      variableType: "float"
    } // ...
  },
  consts: { // Map of minified const variables
    const1: {               // Unminified const name
      variableName: "$0$",  // Substitution value to replace to initialize the const
      variableType: "vec2"  // Type of the const
    } // ...
  }
};
```

The map of uniforms is included to make it easy for the JavaScript code compiling and executing the WebGL shader to
set the uniform values, even after minification.

TypeScript type definitions are included in the webpack-glsl-minify package for the output object. Simply cast to a
`GlslShader` object when including GLSL code:
```javascript
import { GlslShader, GlslVariable, GlslVariableMap } from 'webpack-glsl-minify';

let shader = require('./myshader.glsl') as GlslShader;
```

## Loader Options

```javascript
module: {
  rules: [
    {
      test: /\.glsl$/,
      use: {
        loader: 'webpack-glsl-minify',
        options: {
          output: 'object',
          stripVersion: false,
          preserveDefines: false,
          preserveUniforms: false,
          preserveVariables: false,
          disableMangle: false,
          nomangle: [ 'variable1', 'variable2' ]
        }
      }
    }
  ]
},
resolve: {
  extensions: [ '.glsl' ]
}
```

This loader also supports the following loader-specific options:

* `output`: Default `'object'`, which outputs JavaScript code which exports an object described in the section above.
    Alternatively, `'source'` may be specified which exports only a string containing the source code instead.
    Selecting `'source'` automatically disables mangling of uniforms as there is no output map of the mangled names.
* `stripVersion`: Default `false`. Strips any `#version` directives.
* `preserveDefines`: Default `false`. Disables name mangling of `#define`s.
* `preserveUniforms`: Default `false`. Disables name mangling of uniforms.
* `preserveVariables`: Default `false`. Disables name mangling of variables.
* `preserveAll`: Default `false`. Disables all mangling.
* `disableMangle`: Default `false`. Disables name mangling. This is useful for development purpose.
* `nomangle`: Specifies an array of additional variable names or keywords to explicitly disable name mangling.

## Using Without Webpack

Additionally, webpack-glsl-minify provides a command-line tool which can be used as a build step without Webpack. By
default, it produces `.js` files for each of the input `.glsl` files specified, output in the same directory as the
source `.glsl`. Alternatively, the `-outDir` parameter may be used to produce output in a separate output directory
mirroring the input directory layout.

```console
$ npx webpack-glsl-minify --help
webpack-glsl-minify <files..> [options]

Minifies one or more GLSL files. Input files may be specified in glob syntax.

Options:
  --version            Show version number                             [boolean]
  --ext, -e            Extension for output files      [string] [default: ".js"]
  --outDir, -o         Output base directory. By default, files are output to
                       the same directory as the input .glsl file.      [string]
  --output             Output format
                 [choices: "object", "source", "sourceOnly"] [default: "object"]
  --stripVersion       Strips any #version directives                  [boolean]
  --preserveDefines    Disables name mangling of #defines              [boolean]
  --preserveUniforms   Disables name mangling of uniforms              [boolean]
  --preserveVariables  Disables name mangling of variables             [boolean]
  --preserveAll        Disables all mangling                           [boolean]
  --nomangle           Disables name mangling for a set of keywords      [array]
  --help               Show help                                       [boolean]
```

## Compiling From Source
The source code is written in TypeScript. The build script supports two commands:

* `npm run build` - Compiles the output to `build/`
* `npm run test` - Runs unit tests

## License
Copyright (c) 2018-2020 [Leo C. Singleton IV](https://www.leosingleton.com/).
This software is licensed under the MIT License.
