#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D state;
uniform vec2 scale;

void main() {
    gl_FragColor = vec4(1.0);
}
