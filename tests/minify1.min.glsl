#version 150
attribute vec2 a_position;uniform float A;varying vec2 v_texCoord;void main(){vec2 B=a_position*2.;vec2 C=B-1.;gl_Position=vec4(C*vec2(1,A),0,1);v_texCoord=a_position;}