var NUM_PARTICLES =250000;
var DIM = 1024.0;

// sphere initializations
var spheres = [];
var vertexPositionData = [];
var normalData = [];
var textureCoordData = [];
var indexData = [];
var latitudeBands = 30;
var longitudeBands = 30;
var radius = 0.09;
var sphereVBO;
var normalVBO;
var seed = 0.0;
var usingOBJ = true;
var meshOBJ = [];
var meshOBJnormal = [];
var maxX = -999.0, maxY = -999.0, maxZ = -999.0, minX = 999.0, minY = 999.0, minZ = 999.0;
//particle property
var startColor = [0.0,0.0,1.0,1.0];
var endColor = [1.0,1.0,1.0,1.0];

var MVP = []; 
var obstaclePos = [];
var rotationMatrix = mat4.create();
var persp = mat4.create();
mat4.perspective(persp, 60.0/180.0*Math.PI, DIM/DIM, 0.1, 2000);
var upVector = vec4.create();
upVector[0] = 0.0;
upVector[1] = 1.0;
upVector[2] = 0.0;
upVector[3] = 1.0;
var userSelectedZ = 0.0;

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
        sphereNorm: igloo.array(normalVBO),
        meshPos: igloo.array(meshOBJ),
        meshNorm: igloo.array(meshOBJnormal)
    }

    //create 2 buffers to swap
    this.textures = {
        previous: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.resolution[0], this.resolution[1]),
        current: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.resolution[0], this.resolution[1]),
        obstacleTex: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST).blank(1, 1024),
        levelsetTex: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST).blank(1024, 1024)
    };

    this.framebuffers = {
        update: igloo.framebuffer()
    };

    // this.setRandom();
    //initialization
    this.initTextures();
    this.initBuffers();
    this.initObstacleTex();
    this.initLevelsetTex();
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
            pos[x] = Math.random() * 105.0 + 60.0;
            pos[x + 1] = Math.random() * 20.0 + 235.0;
            pos[x + 2] = Math.random() * 105.0 + 60.0;
            pos[x + 3] = 255.0;
        
            //velocity
            pos[x + 4] = 0.5 * 255.0;
            pos[x + 5] = Math.random() * 20.0 + 98.0;//Math.sin(angle) * 255.0;
            pos[x + 6] = 0.5 * 255.0;
            pos[x + 7] = 255.0;
            
            //position2
            pos[x + 8] = 0.5;
            pos[x + 9] = 0.5;
            pos[x + 10] = 0.5;
            pos[x + 11] = 255.0;
            
            //velocity2
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
ParticleSim.prototype.initObstacleTex = function () {
    //MVP = [];
   // obstaclePos = [];
    var pos = new Uint8Array(1024 * 4);
/*    console.log("called initObstacle");


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
    trans2 = [0.0, -0.5, 0.0, 1.0];

    AddObstacle(trans2);
    //vec4.transformMat4(trans2, trans2, MVP[2]);
    obstaclePos.push(trans2);

    */

    for (var x = 0; x < obstaclePos.length ; x++) {
        pos[4 * x] = (0.5 * obstaclePos[x][0] + 0.5) * 255.0;
        pos[4 * x + 1] = (0.5 * obstaclePos[x][1] + 0.5) * 255.0;
        pos[4 * x + 2] = (0.5 * obstaclePos[x][2] + 0.5) * 255.0;
        pos[4 * x + 3] = 0.55 * radius * 255.0;
    }
    this.textures.obstacleTex.set(pos, 1, 1024);
    return this;
};

//generate obstacle level set
ParticleSim.prototype.initLevelsetTex = function () {

    var pos = new Uint8Array(1024 * 1024 * 4);
    //console.log("called initLevelset");
    //for each pixel
    for (var x = 0; x < 1024 * 1024 ; x++) {
    

        var collideSphere = vec4.create();
        collideSphere[0] = 0.0;
        collideSphere[1] = 0.0;
        collideSphere[2] = 0.0;
        collideSphere[3] = 0.0;


        //pos in world
        var selfPos = vec3.create();
        selfPos[0] = (x % DIM) / 1024.0;
        selfPos[1] = (x / DIM) / 1024.0;
        selfPos[2] = 0.5;

        //bounding box for obj
        if (usingOBJ)
        {
            if (selfPos[0] > (0.5 * maxX + 0.5) || selfPos[1] > (0.5 * maxY + 0.5) || selfPos[0] < (0.5 * minX + 0.5) || selfPos[1] < (0.5 * minY + 0.5))
            {
                //if (x % 1000 == 0)console.log(x);
                pos[4 * x] = collideSphere[0] * 255.0;
                pos[4 * x + 1] = collideSphere[1] * 255.0;
                pos[4 * x + 2] = collideSphere[2] * 255.0;
                pos[4 * x + 3] = 0.55 * collideSphere[3] * 255.0;
                continue;
            } 
        }

        //for each obstacle
        for (var y = 0; y < obstaclePos.length; y++) {

            var sphereCenter = vec3.create();

            sphereCenter[0] = (0.5 * obstaclePos[y][0] + 0.5);
            sphereCenter[1] = (0.5 * obstaclePos[y][1] + 0.5);
            sphereCenter[2] = (0.5 * obstaclePos[y][2] + 0.5);
            selfPos[2] = sphereCenter[2];

            if (vec3.distance(selfPos, sphereCenter) < 0.6 *radius) {
                //console.log("collided");
                collideSphere[0] = sphereCenter[0];
                collideSphere[1] = sphereCenter[1];
                collideSphere[2] = sphereCenter[2];
                collideSphere[3] = radius;
                break;
            }
        }
        //if (x % 1000 == 0)console.log(x);
        pos[4 * x] = collideSphere[0] * 255.0;
        pos[4 * x + 1] = collideSphere[1] * 255.0;
        pos[4 * x + 2] = collideSphere[2] * 255.0;
        pos[4 * x + 3] = 0.55 * collideSphere[3] * 255.0;
    }
    this.textures.levelsetTex.set(pos, 1024, 1024);
    return this;
};
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
    this.textures.levelsetTex.bind(2);

    gl.viewport(0, 0, this.resolution[0], this.resolution[1]);
    this.programs.sim.use()
        .attrib('quad', this.buffers.quad, 2)
        .uniformi('state', 0)
        .uniformi('obstacleState', 1)
        .uniformi('obstacleLevelset',2)
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

    var cam = mat4.create();
    var camTrans = mat4.create();
    var camPos = vec4.create();
    camPos[0] = 0.0; camPos[1] = 0.0; camPos[2] = -3.0;camPos[3] = 1.0;

    mat4.translate(camTrans, camTrans, camPos);
    mat4.multiply(cam, camTrans, rotationMatrix);
    mat4.multiply(cam, persp, cam);

    var identity = mat4.create();

    //2D mode
   // cam = mat4.create();

    //render obj
    if (usingOBJ) {

        this.programs.obstacle.use()
        .attrib('sphere', this.obstacleBuffer.meshPos, 3)
        .attrib('normal', this.obstacleBuffer.meshNorm, 3)
        .matrix('MVP', identity)
        .matrix('camera', cam)
        .draw(gl.TRIANGLES, meshOBJ.length / 3);
    }

    // render spheres
    else {
        for (var i = 0; i < MVP.length; i++) {
            this.programs.obstacle.use()
            .attrib('sphere', this.obstacleBuffer.spherePos, 3)
            .attrib('normal', this.obstacleBuffer.sphereNorm, 3)
            .matrix('MVP', MVP[i])
            .matrix('camera', cam)
            .draw(gl.TRIANGLES, sphereVBO.length / 3);
        }
    }

    this.programs.copy.use()
        .attrib('index', this.buffers.indexes, 1)
        .uniformi('state', 0)
        .uniform('scale', this.resolution)
        .uniform('startCol', startColor)
        .uniform('endCol', endColor)
        .matrix('camera', cam)
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
var simProg = null, controller = null;
var stats = new Stats();
var simController;
var mesh;

var simControl = function () {
    this.startCol = [255, 0, 0, 1];
    this.endCol = [0, 0, 255, 1];
    this.sphereZpos = 0.0;
    this.numParticles = 200;
    this.objCollision = true;

};



$(document).ready(function () {
    var $canvas = $('#particleSim');

    simController = new simControl();

    var gui = new dat.GUI();

    gui.add(simController, 'sphereZpos').onChange(function () {
        //radius = simControl.radius;
        //InitSphere();
       // simProg.initObstacleTex();
       // console.log("CHANGED RADIUS");
      userSelectedZ = simController.sphereZpos; 

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
            //startColor[i][3] = 1.0;
        }
    });

    gui.addColor(simController, 'endCol').onChange(function () {
        for (var i = 0; i < 4; ++i) {
            endColor[i] = simController.endCol[i] / 255.0;
            //endColor[i][3] = 1.0;
        }
    });

    gui.add(simController, 'objCollision').onChange(function () {
        usingOBJ = simController.objCollision;
        obstaclePos = [];
        MVP = [];
        simProg.initLevelsetTex();

    });

    InitSphere();

    //mesh
    var meshScale = 0.2;
    if (usingOBJ) {
        var objStr = document.getElementById('mesh.obj').innerHTML;
        mesh = new OBJ.Mesh(objStr);


        for (var i = 0; i < mesh.vertices.length / 3.0; i++) {
            var newPos = vec4.create();
            newPos[0] = mesh.vertices[3 * i + 0] * meshScale;
            newPos[1] = mesh.vertices[3 * i + 1] * meshScale;
            newPos[2] = mesh.vertices[3 * i + 2] * meshScale;
            newPos[3] = 1.0;

            minX = Math.min(minX, newPos[0]);
            minY = Math.min(minY, newPos[1]);
            minZ = Math.min(minZ, newPos[2]);

            maxX = Math.max(maxX, newPos[0]);
            maxY = Math.max(maxY, newPos[1]);
            maxZ = Math.max(maxZ, newPos[2]);

            AddObstacle(newPos);
            obstaclePos.push(newPos);

        }

        for (var i = 0; i < mesh.indices.length; i++) {
            var index = mesh.indices[i];
            var pos = vec3.create();
            pos[0] = mesh.vertices[index * 3] * meshScale;
            pos[1] = mesh.vertices[index * 3 + 1] * meshScale;
            pos[2] = mesh.vertices[index * 3 + 2] * meshScale;

            var nor = vec3.create();
            nor[0] = mesh.vertexNormals[index * 3];
            nor[1] = mesh.vertexNormals[index * 3 + 1];
            nor[2] = mesh.vertexNormals[index * 3 + 2];

            meshOBJ.push(pos[0]);
            meshOBJ.push(pos[1]);
            meshOBJ.push(pos[2]);

            meshOBJnormal.push(nor[0]);
            meshOBJnormal.push(nor[1]);
            meshOBJnormal.push(nor[2]);


        }



    }

    simProg = new ParticleSim($canvas[0]).draw().begin();
    controller = new Controller(simProg);
    //FPS tracker
    stats.setMode(1);
    document.body.appendChild(stats.domElement);
   

    simProg.initObstacleTex();
    simProg.initLevelsetTex();
    
});

/**
* Manages the user interface for a simulation.
*/
var prevMousePos = [];
function Controller(parSim) {
    this.parSim = parSim;
    var _this = this,
    $canvas = $(parSim.igloo.canvas);
    this.drag = null;
    $canvas.on('mousedown', function (event) {

        _this.drag = event.which;
        var pos = parSim.eventCoord(event);

        if(event.button == 2)
            parSim.click(pos[0], pos[1], _this.drag == 1);
        if (event.button == 0 && _this.drag != null)
        {
            prevMousePos[0] = pos[0];
            prevMousePos[1] = pos[1];
        }
        
       // parSim.draw();
    });
    $canvas.on('mouseup', function (event) {
        _this.drag = null;
    });
    $canvas.on('mousemove', function (event) {
        if (_this.drag) {
            var pos = parSim.eventCoord(event);
            //parSim.click(pos[0], pos[1], _this.drag == 1);
            parSim.drag((pos[0] - prevMousePos[0])/5.0, pos[1] - prevMousePos[1], _this.drag == 1);
         
        }
        //parSim.draw();
    });
    $canvas.on('contextmenu', function (event) {
        event.preventDefault();
        return false;
    });
    $(document).on('keyup', function (event) {
        switch (event.which) {
            case 82: /* r */
                obstaclePos = [];
                MVP = [];
                parSim.initLevelsetTex();
                parSim.initObstacleTex();
         
                break;
      
        };
    });
}

ParticleSim.prototype.click = function (x, y, state) {
    //console.log(x + " " + y);

    var newPos = vec4.create();
    newPos = [(x-0.5)*2.0, (y-0.5)*2.0, userSelectedZ, 1.0];

    AddObstacle(newPos);
    obstaclePos.push(newPos);
    this.initLevelsetTex();
    this.initObstacleTex();
    //console.log(obstaclePos);
    return this;
};

ParticleSim.prototype.drag = function (diffx, diffy, state) {
    mat4.rotate(rotationMatrix, rotationMatrix, diffx, upVector);

    //console.log(rotationMatrix);
    return this;
};

ParticleSim.prototype.eventCoord = function (event) {
    var $target = $(event.target),
    offset = $target.offset(),
    border = 1,
    x = event.pageX - offset.left - border,
    y = $target.height() - (event.pageY - offset.top - border);
    return [Math.floor(x) / DIM, Math.floor(y) / DIM];
};

