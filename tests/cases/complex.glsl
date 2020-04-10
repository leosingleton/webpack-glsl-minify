#version 100

uniform vec3 iResolution;
uniform sampler2D iChannel0;

#define RADIUS 20

@include "complex-include.glsl"

// Input is in YUV format

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	float minB = 1.0;
	float maxB = 0.0;
	for (int x = -RADIUS; x <= RADIUS; x++) {
		for (int y = -RADIUS; y <= RADIUS; y++) {
			vec2 xy = vec2(x, y);
			vec3 c = tex(iChannel0, fragCoord + xy, iResolution);

			float scoreX = 1.0 - (float(abs(x)) / float(RADIUS));
			float scoreY = 1.0 - (float(abs(y)) / float(RADIUS));
			scoreX = smoothstep(-1., 1., scoreX);
			scoreY = smoothstep(-1., 1., scoreX);
			float score = scoreX * scoreY;

			maxB = max(maxB, c.x * score);
			minB = min(minB, c.x * score);
		}
	}
	//vec3 col = vec3(minB, 0.5, 0.5);

	vec3 orig = tex(iChannel0, fragCoord, iResolution);

	minB = min(minB, maxB - 0.5);
	//minB = maxB - 0.5;

	float b = smoothstep(minB, maxB, orig.x);
	vec3 col = vec3(b, orig.yz);

	// Whiten whites
	col.yz = mix(col.yz, vec2(0.5), smoothstep(0.9, 1.0, col.x));


	//col = orig;

	// Output to screen
	fragColor = vec4(YUV2RGB(col), 1.0);
}
