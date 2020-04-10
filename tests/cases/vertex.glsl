#version 150

attribute vec2 a_position;
uniform float u_flipY;
varying vec2 v_texCoord;

void main() {
  // Convert from 0->1 to 0->2
  vec2 zeroToTwo = a_position * 2.0;

  // Convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  // gl_Position is a special variable a vertex shader is responsible for setting
  gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);

  // Pass the texCoord to the fragment shader. The GPU will interpolate this value between points.
  v_texCoord = a_position;
}
