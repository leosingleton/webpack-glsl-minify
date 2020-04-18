'use strict';

// Embed a GLSL file
import glsl from './glsl/test.glsl';

// We must do something with the GlslShader object to avoid it getting optimized away
console.log(JSON.stringify(glsl));
