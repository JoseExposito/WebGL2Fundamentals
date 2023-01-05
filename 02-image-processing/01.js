// https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html
// $ npx serve 02-image-processing

const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    in vec2 a_textCord;

    out vec2 v_textCord;

    uniform vec2 u_resolution;

    void main() {
        v_textCord = a_textCord;

        vec2 zeroToOne = a_position / u_resolution; // Pixels / canvas size
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = (zeroToTwo - 1.0) * vec2(1.0, -1.0); 
        gl_Position = vec4(clipSpace, 0.0, 1.0);
    }
`;

const fragmentShaderSource = `#version 300 es
    precision highp float;

    in vec2 v_textCord;

    out vec4 outColor;

    uniform sampler2D u_image;

    void main() {
        // Original image:
        // outColor = texture(u_image, v_textCord);

        // Red and blue swapped:  
        // outColor = texture(u_image, v_textCord).bgra;

        // Blur (average the left, middle, and right pixels):
        vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
        outColor = (
            texture(u_image, v_textCord) +
            texture(u_image, v_textCord + vec2(onePixel.x, 0)) +
            texture(u_image, v_textCord - vec2(onePixel.x, 0))
        ) / 3.0;
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

const setRectangle = (gl, x, y, width, height) => {
    const x1 = x;
    const x2 = x + width;
    const y1 = y;
    const y2 = y + height;

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2,
        ]),
        gl.STATIC_DRAW,
    );
};

const loadImage = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
});

const main = async () => {
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

    // Get the attributes
    const positionAttrLocation = gl.getAttribLocation(program, 'a_position');
    const textCordAttrLocation = gl.getAttribLocation(program, 'a_textCord');

    // Get uniforms
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const imageUniformLocation = gl.getUniformLocation(program, 'u_image');

    // Create a Vertex Array Object and enable the "a_position" attribute
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttrLocation);

    // Create a buffer and bind it
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Bind the array buffer to the "a_position" attribute, setting its format
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const size = 2;        // 2 floats per
    const type = gl.FLOAT; // iteration
    const normalize = false;
    const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(positionAttrLocation, size, type, normalize, stride, offset);

    // ---------------------------------------------------------------------------------------------

    // Create the texture coordinates buffer
    const textCordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textCordBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0,
        ]),
        gl.STATIC_DRAW,
    );

    gl.enableVertexAttribArray(textCordAttrLocation);

    gl.vertexAttribPointer(textCordAttrLocation, size, type, normalize, stride, offset);

    // Create the texture
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we don't need mips and so we're not filtering
    // and we don't repeat at the edges
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture
    const mipLevel = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const image = await loadImage('leaves.jpg');
    gl.texImage2D(gl.TEXTURE_2D, mipLevel, internalFormat, srcFormat, srcType, image);

    // ---------------------------------------------------------------------------------------------

    // Set the canvas size
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Use our program
    gl.useProgram(program);

    // Bind our VAO
    gl.bindVertexArray(vao);

    // Set the uniforms
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(imageUniformLocation, 0);

    // Bind the positionBuffer so setRectangle stores the data there and draw
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    setRectangle(gl, 0, 0, image.width, image.height);

    const primitiveType = gl.TRIANGLES;
    const drawOffset = 0;
    const count = 6;
    gl.drawArrays(primitiveType, drawOffset, count);
};

main()
    .then(() => console.log('Main finished OK :D'))
    .catch((err) => console.log(`Main finished with error: ${err}`));
