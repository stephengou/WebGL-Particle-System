#ifdef GL_ES
precision mediump float;
#endif

attribute vec3 sphere;
attribute vec3 normal;

uniform mat4 MVP;
uniform mat4 camera;

varying vec3 fs_normal;

void main() {
	fs_normal = normal;
    gl_Position =  camera* MVP * vec4(sphere, 1.0);
}
