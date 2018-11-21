#version 100

precision mediump float;

// Add the texture coordinates from the vertex shader
varying vec2 v_texCoord;

uniform texture2D u_y;
uniform texture2D u_cb;
uniform texture2D u_cr;

/**
 * Convert YCbCr colorspace to RGB
 */
vec3 YCbCr2RGB(in vec3 color)
{
  vec3 offset = vec3(0, -0.5, -0.5);
  mat3 transform = mat3(
    1.0, 0.0, 1.402,
    1.0, -0.344136, -0.714136,
    1.0, 1.772, 0.0);
  
  return (color + offset) * transform;
}

void main()
{
  vec3 y = texture2D(u_y, v_texCoord).rgb;
  vec3 cb = texture2D(u_cb, v_texCoord).rgb;
  vec3 cr = texture2D(u_cr, v_texCoord).rgb;

  vec3 in0 = vec3(y.x, cb.x, cr.x);
  gl_FragColor = vec4(YCbCr2RGB(in0), 1.0);
}
