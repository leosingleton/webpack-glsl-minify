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
