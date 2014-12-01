#ifdef GL_ES
precision mediump float;
#endif


#define DIM 1024.0

uniform sampler2D state;
uniform vec2 scale;
uniform vec4 startCol;
uniform vec4 endCol;
const float DELTA = 0.2;

void main() {
   // gl_FragColor = vec4(1.0);
   /*
   vec2 pos = gl_FragCoord.xy/DIM;
   float y = pos.y;

   vec3 color = mix(vec3(1.0),vec3(0.0,0.0,1.0),y);
   gl_FragColor = vec4(color,1.0);*/



   vec2 pos = gl_FragCoord.xy/DIM;
   float y = pos.y;
   vec4 color = mix(endCol,startCol,y);
       vec2 p = 2.0 * (gl_PointCoord - 0.5);
	   color.a = 1.0;
    float a = smoothstep(1.0 - DELTA, 1.0, length(p));
    gl_FragColor = pow(mix(color, vec4(0, 0, 0, 0), a), vec4(1));

}
