// Instantiate multiple uniforms on a single line, comma-separated
uniform float uRed, uGreen, uBlue;

void main()
{
  gl_FragColor = vec4(uRed, uGreen, uBlue, 1.0);
}
