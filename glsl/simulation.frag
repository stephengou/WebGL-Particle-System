#ifdef GL_ES
precision mediump float;
#endif


#define DIM 1024.0
#define dT 0.017
uniform sampler2D state;
uniform vec2 scale;

vec4 shift(vec4 pos)
{
	return 2.0*(pos - vec4(0.5));
}

void main() {

	vec2 SUV = gl_FragCoord.xy;

	float type = mod(SUV.x,4.0);


	vec4 newValue = texture2D(state, SUV/DIM);
	//if position
	if(type<1.5)
	{
		newValue = texture2D(state, SUV/DIM) + dT * shift(texture2D(state, vec2(SUV.x + 1.0,SUV.y)/DIM));
		if(newValue.y <= 0.0)
			newValue.y += 1.0;
		if(newValue.x <= 0.0)
			newValue.x += 1.0;
		if(newValue.x >= 1.0)
			newValue.x += 0.0;
	}

	//if velocity
	else if(type<2.5)
	{
		newValue = texture2D(state,SUV/DIM) + dT * vec4(0.000,-1.0,0.000,1.0);

	}

	//if color
	else if(type<3.5)
	{
		//newValue = texture2D(state, SUV/DIM) + vec4(0.1,0.1,0.1,1.0);
	}

	//if else (size and etc.)
	else if(type<4.5)
	{
		//newValue = texture2D(state, SUV/DIM) + vec4(0.2,0.2,0.2,1.0);
	}
	gl_FragColor = vec4(newValue);
}
