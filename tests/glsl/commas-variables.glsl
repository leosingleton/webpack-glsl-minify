void main()
{
  // Multiple variables can be defined on a single line, separated by commas
  float red, green, blue = 0.5, alpha = 1.0;

  // Multiple variables can be initialized on a single line, separated by commas
  red = 0.5, blue = 0.5;

  gl_FragColor = vec4(red, green, blue, alpha);
}
