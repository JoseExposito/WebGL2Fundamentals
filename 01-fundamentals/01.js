// https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html

const vertexShaderSource = `#version 300 es
    in vec4 a_position;

    void main() {
        gl_Position = a_position;
    }
`;

const fragmentShaderSource = `#version 300 es
    precision highp float;
    out vec4 outColor;

    void main() {
        outColor = vec4(1.0, 0.0, 0.5, 1.0);
    }
`;

const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!ok) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error);
    }

    return shader;
};

const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const ok = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!ok) {
        const error = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(error);
    }

    return program;
};

const main = () => {
    const canvas = document.getElementById('c');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL 2 is not supported :(');
    }

    // Create the shaders and program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // Create the position array buffer
    const positions = [
        0.0, 0.0,
        0.0, 0.5,
        0.7, 0.0,
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Get the "a_position" attribute
    const positionAttrLocation = gl.getAttribLocation(program, 'a_position');

    // Create a Vertex Array Object and enable the "a_position" attribute
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttrLocation);

    // Bind the array buffer to the "a_position" attribute, setting its format
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const size = 2;        // 2 floats per
    const type = gl.FLOAT; // iteration
    const normalize = false;
    const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(positionAttrLocation, size, type, normalize, stride, offset);

    // ---------------------------------------------------------------------------------------------

    // Set the canvas size
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use our program
    gl.useProgram(program);

    // Bind our VAO
    gl.bindVertexArray(vao);

    // And draw
    const primitiveType = gl.TRIANGLES;
    const drawOffset = 0;
    const count = 3;
    gl.drawArrays(primitiveType, drawOffset, count);
};

main();
