precision mediump float;
uniform lowp float uMultiplier;
varying highp vec2 vTexCoord;

highp vec4 toVec4(in lowp float c)
{
  return vec4(c);
}

void main()
{
  highp vec4 one = toVec4(1.0);
  gl_FragColor = one * uMultiplier;
}
