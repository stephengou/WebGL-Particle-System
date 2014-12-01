var NUM_PARTICLES =50000;
var DIM = 1024;

// sphere initializations
var spheres = [];
var vertexPositionData = [];
var normalData = [];
var textureCoordData = [];
var indexData = [];
var latitudeBands = 30;
var longitudeBands = 30;
var radius = 0.2;
var sphereVBO;
var normalVBO;
var seed = 0.0;

//particle property
var startColor = [0.0,0.0,1.0,1.0];
var endColor = [1.0,1.0,1.0,1.0];

var MVP = []; 
var obstaclePos = [];

function ParticleSim(canvas, scale) {
    var igloo = this.igloo = new Igloo(canvas);

    var gl = igloo.gl;

    var w = canvas.width, h = canvas.height;

    this.resolution= new Float32Array([w, h]);

    this.timer = null;
 //   this.lasttick = ParticleSim.now();

    gl.disable(gl.DEPTH_TEST);
    this.programs = {
        copy: igloo.program('glsl/draw.vert', 'glsl/display.frag'),
        sim: igloo.program('glsl/quad.vert', 'glsl/simulation.frag'),
        obstacle: igloo.program('glsl/vertex.vert','glsl/fragment.frag')
    };
    //a quad for entire screen
    this.buffers = {
        quad: igloo.array(Igloo.QUAD2),
        indexes: igloo.array(),
    };

    this.obstacleBuffer =
    {
        spherePos: igloo.array(sphereVBO),
        sphereNorm: igloo.array(normalVBO)
    }

    //create 2 buffers to swap
    this.textures = {
        previous: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.resolution[0], this.resolution[1]),
        current: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.resolution[0], this.resolution[1]),
        obstacleTex: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST).blank(1,1024)
    };

    this.framebuffers = {
        update: igloo.framebuffer()
    };

    // this.setRandom();
    //initialization
    this.initTextures();
    this.initBuffers();
    this.initObstacleTex();
}

// init texture
ParticleSim.prototype.initTextures = function () {
    var pos = new Uint8Array(DIM * DIM * 4);
    /*
    for (var x = 0; x < DIM * DIM * 4 ; x++) {
        pos[x] = 128;
    }*/
    
    for (var x = 0; x < NUM_PARTICLES * 4 * 4; x += 16) {
            
            //position
            pos[x] = Math.random() * 255.0;
            pos[x + 1] = Math.random() * 20.0 + 235.0;
            pos[x + 2] = 0.5 * 255.0;
            pos[x + 3] = 255.0;
        
            //velocity
            pos[x + 4] = Math.random() * 40 + 0.5 * 255.0 - 20.0;
            pos[x + 5] = Math.random() * 20.0 + 98.0;//Math.sin(angle) * 255.0;
            pos[x + 6] = 0.5 * 255.0;
            pos[x + 7] = 255.0;
            
            //
            pos[x + 8] = 0.5;
            pos[x + 9] = 0.5;
            pos[x + 10] = 0.5;
            pos[x + 11] = 255.0;
            
            //
            pos[x + 12] = 0.5;
            pos[x + 13] = 0.5;
            pos[x + 14] = 0.5;
            pos[x + 15] = 255.0;
    }


    this.textures.previous.set(pos, DIM, DIM);
    this.textures.current.blank(DIM, DIM);
    return this;
};

//init obstacle tex
ParticleSim.prototype.initObstacleTex = function ()
{
    MVP = [];
    obstaclePos = [];

    var pos = new Uint8Array(1024 * 4);
    var zero = vec4.create();
    zero = [0.0, 0.0, 0.0, 1.0];

    var one = vec4.create();
    one = [-0.5, 0.0, 0.0, 1.0];

    AddObstacle(one);
    obstaclePos.push(one);

    var trans = vec3.create();
    trans = [0.5, 0.0, 0.0];

    AddObstacle(trans);
    vec4.transformMat4(zero, zero, MVP[1]);
    obstaclePos.push(zero);

    var trans2 = vec4.create();
    trans2 = [0.0, -0.5, 0.0,1.0];

    AddObstacle(trans2);
    //vec4.transformMat4(trans2, trans2, MVP[2]);
    obstaclePos.push(trans2);



    //obstaclePos.push([-0.2, 0.0, 0.0]);
   //  obstaclePos.push([0.0, 0.0, 0.0]);
    
    for (var x = 0; x < obstaclePos.length ; x++)
    {
        pos[4 * x] = (0.5 * obstaclePos[x][0] + 0.5) * 255.0;
        pos[4 * x + 1] = (0.5 * obstaclePos[x][1] + 0.5) * 255.0;
        pos[4 * x + 2] = (0.5 * obstaclePos[x][2] + 0.5) * 255.0;
        pos[4*x + 3] = 0.55 * radius * 255.0;
    }
    this.textures.obstacleTex.set(pos,1,1024);
    return this;
}
// Init index buffer for each particle
ParticleSim.prototype.initBuffers = function () {
    var w = this.resolution[0], h = this.resolution[1],
        gl = this.igloo.gl,

        indexes = new Float32Array(NUM_PARTICLES);

    for (var x = 0; x < NUM_PARTICLES; x++) {
        indexes[x] = x;
    }
    this.buffers.indexes.update(indexes, gl.STATIC_DRAW);
    return this;
};

//swap current and previous state texture
ParticleSim.prototype.swapTexture = function () {
    var tmp = this.textures.previous;
    this.textures.previous  = this.textures.current;
    this.textures.current = tmp;

    return this;
};

ParticleSim.prototype.update = function () {
    stats.update();
    var gl = this.igloo.gl;

    this.framebuffers.update.attach(this.textures.current);

    this.textures.previous.bind(0);
    this.textures.obstacleTex.bind(1);

    gl.viewport(0, 0, this.resolution[0], this.resolution[1]);
    this.programs.sim.use()
        .attrib('quad', this.buffers.quad, 2)
        .uniformi('state', 0)
        .uniformi('obstacleState', 1)
        .uniform('seed',seed)
        .uniform('scale', this.resolution)
        .uniform('nSphere', MVP.length)
        .draw(gl.TRIANGLE_STRIP, 4);
    this.swapTexture();
    return this;
};

ParticleSim.prototype.draw = function () {
    var gl = this.igloo.gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.igloo.defaultFramebuffer.bind();
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  //  gl.enable(gl.DEPTH_TEST);

    this.textures.previous.bind(0);
    gl.viewport(0, 0, this.resolution[0], this.resolution[1]);


    for(var i = 0;i<MVP.length; i++)
    {
        this.programs.obstacle.use()
        .attrib('sphere', this.obstacleBuffer.spherePos, 3)
        .attrib('normal', this.obstacleBuffer.sphereNorm, 3)
        .matrix('MVP', MVP[i])
        .draw(gl.TRIANGLES, sphereVBO.length / 3);
    }

    this.programs.copy.use()
        .attrib('index', this.buffers.indexes, 1)
        .uniformi('state', 0)
        .uniform('scale', this.resolution)
        .uniform('startCol', startColor)
        .uniform('endCol',endColor)
        .draw(gl.POINTS, NUM_PARTICLES);


    
    return this;
};

ParticleSim.prototype.begin = function () {

    if (this.timer == null) {

        this.timer = setInterval(function () {
            seed += 0.1;
            if (seed % 15.0 < 0.1) simProg.initTextures(); 
            simProg.update();
            simProg.draw();
        }, 17);
    }
    return this;
};

AddObstacle = function (pos) {
    var zero = vec4.create();
    zero = [0.0, 0.0, 0.0, 1.0];

    var matrix = mat4.create();
    mat4.translate(matrix, matrix, pos);
    MVP.push(matrix);

}

//Sphere VBO found online
InitSphere = function () {

    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);

            normalData.push(x);
            normalData.push(y);
            normalData.push(z);
            textureCoordData.push(u);
            textureCoordData.push(v);
            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);
        }
    }
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }

    
    sphereVBO = new Float32Array(indexData.length*3);
    for (var i = 0; i < indexData.length; i++)
    {
        sphereVBO[3*i] = vertexPositionData[indexData[i]*3 +0 ];
        sphereVBO[3*i+1] = vertexPositionData[indexData[i]*3+1];
        sphereVBO[3*i+2] = vertexPositionData[indexData[i]*3+2];
    }


    normalVBO = new Float32Array(indexData.length * 3);
    for (var i = 0; i < indexData.length; i++) {
        normalVBO[3 * i] = normalData[indexData[i] * 3 + 0];
        normalVBO[3 * i + 1] = normalData[indexData[i] * 3 + 1];
        normalVBO[3 * i + 2] = normalData[indexData[i] * 3 + 2];
    }
}
/*
ParticleSim.prototype.drawSphere = function () {

    var gl = this.igloo.gl;
    this.igloo.defaultFramebuffer.bind();
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, this.resolution[0], this.resolution[1]);
    this.programs.obstacle.use()
        .attrib('sphere', this.obstacleBuffer.sphere,3)
        .draw(gl.TRIANGLES, sphereVBO.length/3);
    return this;
};
*/

//start simulation
var simProg = null;
var stats = new Stats();
var simController;

var simControl = function () {
    this.startCol = [255, 0, 0, 1];
    this.endCol = [0, 0, 255, 1];
    this.radius = 0.1;
    this.numParticles = 200;

};
$(document).ready(function () {
    var $canvas = $('#particleSim');

    simController = new simControl();
    var gui = new dat.GUI();

    gui.add(simController, 'radius').onChange(function () {
        //radius = simControl.radius;
        //InitSphere();
       // simProg.initObstacleTex();
       // console.log("CHANGED RADIUS");

    });
    gui.add(simController, 'numParticles').min(1).max(50000).step(200).onChange(function () {
        //radius = simControl.radius;
        //InitSphere();
        // simProg.initObstacleTex();
        // console.log("CHANGED RADIUS");
        NUM_PARTICLES = simController.numParticles;

    });
    gui.addColor(simController, 'startCol').onChange(function () {
        for (var i = 0; i < 4; ++i) {
            startColor[i] = simController.startCol[i] / 255.0;
            startColor[i][3] = 1.0;
        }
    });

    gui.addColor(simController, 'endCol').onChange(function () {
        for (var i = 0; i < 4; ++i) {
            endColor[i] = simController.endCol[i] / 255.0;
            endColor[i][3] = 1.0;
        }
    });

    InitSphere();
    simProg = new ParticleSim($canvas[0]).draw().begin();
    //FPS tracker
    stats.setMode(1);
    document.body.appendChild(stats.domElement);
});

window.onload = function () {

    


};