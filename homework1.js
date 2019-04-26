"use strict";

var canvas;
var gl;

var numVertices  = 36;

var numChecks = 8;

var program;

var c;

var flag = true;

var pointsArray = [];
var colorsArray = [];

// modelView parameters
var modelViewMatrix, modelViewMatrixLoc;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var eye;
var radius = 6.0
var theta = 0.0,
    phi = 0.0;
var dr = 5.0 * Math.PI/180.0;

// orthogonal projection parameters
var projectionMatrix, projectionMatrixLoc;
var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;
var near = -10.0, far = 10.0;

// scaling parameters
var scalingMatrix, scalingMatrixLoc;
var scalingAmount = 0.5;

// translation parameters
var translationMatrix, translationMatrixLoc
var translationX = 0.0,
    translationY = 0.0,
    translationZ = 0.0;


var vertices = [
    vec4(-0.5, -0.5,  0.5, 1.0),
    vec4(-0.5,  0.5,  0.5, 1.0),
    vec4(0.5,  0.5,  0.5, 1.0),
    vec4(0.5, -0.5,  0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5,  0.5, -0.5, 1.0),
    vec4(0.5,  0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0)   // white
];

var thetaLoc;

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[b]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[d]);
     colorsArray.push(vertexColors[a]);
}

function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();
    
    // Load data into the GPU
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    scalingMatrixLoc = gl.getUniformLocation(program, "scalingMatrix");
    translationMatrixLoc = gl.getUniformLocation(program, "translationMatrix");

    // Listeners for the eye position
    document.getElementById("ThetaUp").onclick = function(){theta += dr;};
    document.getElementById("ThetaDown").onclick = function(){theta -= dr;};
    document.getElementById("PhiUp").onclick = function(){phi += dr;};
    document.getElementById("PhiDown").onclick = function(){phi -= dr;};
    document.getElementById("RUp").onclick = function(){radius *= 2.0;};
    document.getElementById("RDown").onclick = function(){radius *= 0.5;};

    // Listeners for the viewing volume
    document.getElementById("ZUp").onclick = function(){near  *= 1.1; far *= 1.1;};
    document.getElementById("ZDown").onclick = function(){near  *= 0.9; far *= 0.9;};
    document.getElementById("Narrower").onclick = function(){left *= 1.1; right *= 1.1;};
    document.getElementById("Wider").onclick = function(){left  *= 0.9; right *= 0.9;};
    document.getElementById("Shorter").onclick = function(){ytop *= 1.1; bottom *= 1.1;};
    document.getElementById("Higher").onclick = function(){ytop  *= 0.9; bottom *= 0.9;};

    // Listener for the scaling 
    document.getElementById("Scale").oninput = function(){scalingAmount = event.srcElement.valueAsNumber;};

    // Listeners for the translations over the X, Y and Z axis
    document.getElementById("TranslateX").oninput = function(){translationX = event.srcElement.valueAsNumber;};
    document.getElementById("TranslateY").oninput = function(){translationY = event.srcElement.valueAsNumber;};
    document.getElementById("TranslateZ").oninput = function(){translationZ = event.srcElement.valueAsNumber;};

    // Listeners for the far and near sliders
    document.getElementById("Far").oninput = function(){far = event.srcElement.valueAsNumber;};
    document.getElementById("Near").oninput = function(){near = event.srcElement.valueAsNumber;};
    
    render();
}

var render = function() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3( radius * Math.sin(theta) * Math.cos(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(theta));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    scalingMatrix = scalem(scalingAmount, scalingAmount, scalingAmount);
    translationMatrix = translate(translationX, translationY, translationZ);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(scalingMatrixLoc, false, flatten(scalingMatrix));
    gl.uniformMatrix4fv(translationMatrixLoc, false, flatten(translationMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    requestAnimFrame(render);
}
