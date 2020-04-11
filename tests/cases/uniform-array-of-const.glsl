@const int KERNEL_SIZE

precision mediump float;

varying vec2 vCoord;
uniform sampler2D uInput;
uniform vec2 uInputSize;
uniform float uKernel[KERNEL_SIZE];
uniform int uIsX;
uniform int uIsY;

void main()
{
  vec2 onePixel = vec2(1.0, 1.0) / uInputSize;
  const int halfKernelSize = KERNEL_SIZE / 2;

  vec4 colorSum = vec4(0.0);
  for (int n = 0; n < KERNEL_SIZE; n++)
  {
    int pos = n - halfKernelSize;
    colorSum += texture2D(uInput, vCoord + onePixel * vec2(pos * uIsX, pos * uIsY)) * uKernel[n];
  }

  gl_FragColor = vec4(colorSum.rgb, 1.0);
}
