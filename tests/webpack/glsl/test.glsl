#version 100

precision mediump float;

@include "./included.glsl"

// Add the texture coordinates from the vertex shader
varying vec2 v_texCoord;

uniform sampler2D u_y;
uniform sampler2D u_cb;
uniform sampler2D u_cr;

void main()
{
  vec3 y = texture2D(u_y, v_texCoord).rgb;
  vec3 cb = texture2D(u_cb, v_texCoord).rgb;
  vec3 cr = texture2D(u_cr, v_texCoord).rgb;

  vec3 in0 = vec3(y.x, cb.x, cr.x);
  gl_FragColor = vec4(YCbCr2RGB(in0), 1.0);
}
