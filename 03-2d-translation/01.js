// https://webgl2fundamentals.org/webgl/lessons/webgl-2d-translation.html

const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    uniform vec2 u_resolution;
    uniform vec2 u_translation;

    void main() {
        vec2 translatedPos = a_position + u_translation;
        vec2 zeroToOne = translatedPos / u_resolution; // Pixels / canvas size
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = (zeroToTwo - 1.0) * vec2(1.0, -1.0); 
        gl_Position = vec4(clipSpace, 0.0, 1.0);
    }
`;

const fragmentShaderSource = `#version 300 es
    precision highp float;
    out vec4 outColor;
    uniform vec4 u_color;

    void main() {
        outColor = u_color;
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

const setGeometry = (gl) => {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // left column
            0, 0,
            30, 0,
            0, 150,
            0, 150,
            30, 0,
            30, 150,
    
            // top rung
            30, 0,
            100, 0,
            30, 30,
            30, 30,
            100, 0,
            100, 30,
    
            // middle rung
            30, 60,
            67, 60,
            30, 90,
            30, 90,
            67, 60,
            67, 90,
        ]),
        gl.STATIC_DRAW,
    );
};

const random = (max) => Math.floor(Math.random() * max);

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

    // ---------------------------------------------------------------------------------------------

    // Create the position array buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

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

    // Vertex shader uniform locations
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const translationUniformLocation = gl.getUniformLocation(program, 'u_translation');

    // Fragment shader uniform locations
    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');

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

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Set the translation
    gl.uniform2f(translationUniformLocation, 150, 0);

    // And draw
    gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

    setGeometry(gl);

    const primitiveType = gl.TRIANGLES;
    const drawOffset = 0;
    const count = 18;
    gl.drawArrays(primitiveType, drawOffset, count);
};

main();
