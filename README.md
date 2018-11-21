# GLSL Loader, Preprocessor, and Minifier for Webpack
webpack-glsl-minify is a loader for Webpack that handles GLSL files. In addition to simply loading the GLSL program
into a JavaScript string, it also has a preprocessor which executes at compile time, and a minifier which shrinks the
GLSL program before embedding it in JavaScript.

## Building
The build script supports two targets:

* `./build.sh` - Compiles the output to `build/index.js`
* `./build.sh test` - Compiles the output and runs unit tests

## Usage
### Webpack Configuration
To use, add the following to your webpack.js config file:

```javascript
module: {
  rules: [
    {
      test: /\.glsl$/,
      use: path.resolve(__dirname, './path/webpack-glsl-minify')
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
Disables minification on or more symbols. Example:
```
@nomangle symbol1 symbol2
```

### Minification
The following minification optimizations are performed:

* Removal of comments and whitespace. Both C-style `/* Comment */` and C++-style `// Comment` are supported.
* Shortening floating point numbers. `1.0` becomes `1.`
* Minification of symbols. All function names, variables, parameters, and uniforms are included. Built-in GLSL
  functions and variables begining with `gl_` are automatically excluded. Attributes and varying variables are also
  excluded, as the names must be consistent across multiple shaders. Additional symbols may be excluded with the
  `@nomangle` directive.

### Output
As output, the following JavaScript code is produced:
```javascript
module.exports = {
  "code": "uniform vec3 A;uniform float B;/* ... More minified GLSL code here */",
  "map": { // Map of minified uniform variables
    "uniform1": {     // Unminified uniform name
      "min": "A",     // Minified uniform name
      "type": "vec3"  // Type of the uniform
    },
    "uniform2": {
      "min": "B",
      "type": "float"
    } // ...
  }
};
```

The map of uniforms is included to make it easy for the JavaScript code compiling and executing the WebGL shader to
set the uniform values, even after minification.
