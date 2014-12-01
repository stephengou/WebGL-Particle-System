#ifdef GL_ES
precision mediump float;
#endif ;

varying vec3 fs_normal;

void main() {
    vec3 surfaceCol = vec3(0.4,0.7,0.5);
	vec3 lightPos = vec3(0.0, 1.0, -7.0);
	float diffuse = dot(normalize(lightPos), normalize(fs_normal));
  //  gl_FragColor = vec4(fs_normal,1.0);
	if(diffuse >= 0.0) gl_FragColor = vec4(diffuse*surfaceCol,1.0);
	else gl_FragColor = vec4(diffuse*surfaceCol,0.0);
}
