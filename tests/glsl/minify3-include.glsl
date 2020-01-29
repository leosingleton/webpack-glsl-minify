
vec3 RGB2YUV(in vec3 color)
{
    // Constants are the same as JPEG encoding (from Wikipedia on YCbCr)
    mat3 transform = mat3(
        0.299, 0.587, 0.114,
    	-0.168736, -0.331264, 0.5,
    	0.5, -0.418668, -0.081312);
    vec3 offset = vec3(0, 0.5, 0.5);
    
    return color * transform + offset;
}

vec3 YUV2RGB(in vec3 color)
{
    // Constants are the same as JPEG encoding (from Wikipedia on YCbCr)
    vec3 offset = vec3(0, -0.5, -0.5);
    mat3 transform = mat3(
        1.0, 0.0, 1.402,
    	1.0, -0.344136, -0.714136,
    	1.0, 1.772, 0.0);
    
    return (color + offset) * transform;
}

vec3 tex(in sampler2D sampler, in vec2 fragCoord, in vec3 resolution)
{
    vec2 uv = fragCoord / resolution.xy;
    vec3 col = texture2D(sampler, uv).rgb;
    return RGB2YUV(col);
}
