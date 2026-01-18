export class FullscreenQuad {
    private vao: WebGLVertexArrayObject;
    private buffer: WebGLBuffer;

    constructor(private gl: WebGL2RenderingContext) {
        // Positions for a fullscreen quad (2 triangles)
        // -1, -1 -> bottom left
        //  1,  1 -> top right
        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]);

        const vao = gl.createVertexArray();
        if (!vao) throw new Error("Could not create VAO");
        this.vao = vao;

        gl.bindVertexArray(this.vao);

        const vbo = gl.createBuffer();
        if (!vbo) throw new Error("Could not create VBO");
        this.buffer = vbo;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Attribute 0: position
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
    }

    draw(program: WebGLProgram) {
        this.gl.useProgram(program);
        this.gl.bindVertexArray(this.vao);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        this.gl.bindVertexArray(null);
    }
}
