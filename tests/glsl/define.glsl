@define MY_OUT gl_FragColor
@define  MY_OUT_RESULT  void
@define MY_OUTFN main
@define MY_VEC4 vec4
@define MY_VAL 1.0

MY_OUT_RESULT MY_OUTFN() { MY_OUT = MY_VEC4(MY_VAL, MY_VAL, MY_VAL, MY_VAL); }