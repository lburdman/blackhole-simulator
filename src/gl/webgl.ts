export class WebGLContext {
    constructor(private gl: WebGL2RenderingContext) { }

    createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        if (!shader) throw new Error('Could not create shader');

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compile error: ${info}`);
        }
        return shader;
    }

    createProgram(vsSrc: string, fsSrc: string): WebGLProgram {
        const program = this.gl.createProgram();
        if (!program) throw new Error('Could not create program');

        const vs = this.createShader(this.gl.VERTEX_SHADER, vsSrc);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSrc);

        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Program link error: ${info}`);
        }
        return program;
    }
}
