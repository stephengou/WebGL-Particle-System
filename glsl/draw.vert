#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D state;
attribute float index;
uniform mat4 camera;

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
	vec4 newPos = camera* shift(vec4(pos,1.0));
    gl_Position = newPos;
	gl_PointSize = 2.0 * (0.5 *newPos.z + 0.5);
}
