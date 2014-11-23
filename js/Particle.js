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
        simProg: igloo.program('glsl/quad.vert', 'glsl/simulation.frag')
    };
    //a quad for entire screen
    this.buffers = {
        quad: igloo.array(Igloo.QUAD2),
        indexes: igloo.array()
    };

    //create 2 buffers to swap
    this.textures = {
        previous: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.resolution[0], this.resolution[1]),
        current: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.resolution[0], this.resolution[1])
    };

    this.framebuffers = {
        update: igloo.framebuffer()
    };

    // this.setRandom();
    //initialization
    this.initBuffers();
}

// Init index buffer for each particle
ParticleSim.prototype.initBuffers = function () {
    var w = this.resolution[0], h = this.resolution[1],
        gl = this.igloo.gl,

        indexes = new Float32Array(10);

    /*for (var y = 0; y < th; y++) {
        for (var x = 0; x < tw; x++) {
            var i = y * tw * 2 + x * 2;
            indexes[i + 0] = x;
            indexes[i + 1] = y;
        }
    }*/
    for (var x = 0; x < 10; x++) {
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
 
    var gl = this.igloo.gl;

    this.framebuffers.update.attach(this.textures.current);

    this.textures.previous.bind(0);

    gl.viewport(0, 0, this.resolution[0], this.resolution[1]);
    this.programs.simProg.use()
        .attrib('quad', this.buffers.quad, 2)
        .uniformi('state', 0)
        .uniform('scale', this.resolution)
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

    this.textures.previous.bind(0);
    gl.viewport(0, 0, this.resolution[0], this.resolution[1]);
    this.programs.copy.use()
        .attrib('index', this.buffers.indexes, 1)
        .uniformi('state', 0)
        .uniform('scale', this.resolution)
        .draw(gl.POINTS,10);
    return this;
};

ParticleSim.prototype.begin = function () {
    if (this.timer == null) {

        this.timer = setInterval(function () { 
            simProg.update();
            simProg.draw();
        }, 60);
    }
    return this;
};

//start simulation
var simProg = null;
$(document).ready(function () {
    var $canvas = $('#particleSim');
    simProg = new ParticleSim($canvas[0]).draw().begin();
});