#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D state;
uniform vec2 scale;

void main() {


	vec3 newCol = texture2D(state, gl_FragCoord.xy).rgb + vec3(0.01);
	gl_FragColor = vec4(newCol,1.0);
}
