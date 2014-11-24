#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D state;
attribute float index;

#define DIM 1024.0

vec2 getLoc(float index)
{
	float y = floor(index * 4.0 / DIM);
	float x = index * 4.0 - y * DIM;

	return vec2(x ,y )/DIM;
}

vec4 shift(vec4 pos)
{
	return 2.0*(pos - vec4(0.5));
}

void main() {
	float texSize = 1.0/DIM;

	vec3 pos = texture2D(state, getLoc(index)).rgb;
	
    gl_Position = shift(vec4(pos,1.0));
	gl_PointSize = 15.0;
}
