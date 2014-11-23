#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D state;
attribute float index;

void main() {
	float x = texture2D(state, vec2(0.0,0.0)).r;
	float y = index/10.0;
    gl_Position = vec4(x,y, 0.0,1.0);
	gl_PointSize = 10.0;
}
