import { WebGLContext } from './gl/webgl';
import { FullscreenQuad } from './gl/quad';
import { Camera } from './sim/camera';
import { SimulationParams } from './sim/params';
import { Orbiter } from './sim/orbiter';
import { initControls } from './ui/controls';
import { vertSrc, fragSrc } from './shaders/source';

async function main() {
    const canvas = document.getElementById('gl-canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');

    const params = new SimulationParams();
    const camera = new Camera(canvas);
    const orbiter = new Orbiter();

    // Initialize WebGL
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('WebGL2 not supported');
        return;
    }

    // Extensions check
    if (!gl.getExtension('EXT_color_buffer_float')) {
        console.warn('EXT_color_buffer_float not supported');
    }

    const context = new WebGLContext(gl);
    const program = context.createProgram(vertSrc, fragSrc);
    const quad = new FullscreenQuad(gl);

    // Initial Resize
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl!.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    // Init UI - Hacky way to hook up reset button without major refactor
    initControls(params, camera, canvas);
    // Find the controller for resetOrbit and overwrite it? 
    // Easier: check a flag or just let the user toggle 'enable' to reset.
    // For now, let's just make the 'Reset Orbit' button in UI trigger a dirty flag?
    // Actually, we can just attach the listener directly to the gui object if we had it return the object.
    // Since initControls is void, we'll patch params with a resetOrbiterReq flag.
    (params as any)._resetOrbit = () => orbiter.reset(params);

    // Main Loop
    let lastTime = 0;

    // Debug: Clear to known color to verify context
    gl!.clearColor(0.2, 0.0, 0.2, 1.0);

    function loop(time: number) {
        requestAnimationFrame(loop);

        // Debug clear
        gl!.clear(gl!.COLOR_BUFFER_BIT);

        const validTime = time * 0.001;
        const dt = validTime - lastTime;
        lastTime = validTime;

        if (params.paused) {
            // Still render
        } else {
            params.time += dt;
            orbiter.update(dt, params);
        }

        camera.update();

        gl!.useProgram(program);

        // Update Uniforms
        const uLoc = (name: string) => gl!.getUniformLocation(program, name);

        gl!.uniform2f(uLoc('uResolution'), canvas.width, canvas.height);
        gl!.uniform1f(uLoc('uTime'), params.time); // Use internal physics time
        gl!.uniform3fv(uLoc('uCamPos'), camera.position);
        gl!.uniform3fv(uLoc('uCamUp'), camera.up);
        gl!.uniform3fv(uLoc('uCamTarget'), camera.target);
        gl!.uniform1f(uLoc('uFov'), camera.fov);

        // Physics / Render Params
        gl!.uniform1f(uLoc('uMass'), params.mass);
        gl!.uniform1f(uLoc('uSpin'), params.spin);

        // Disk
        gl!.uniform1f(uLoc('uDiskInner'), params.diskInner);
        gl!.uniform1f(uLoc('uDiskOuter'), params.diskOuter);
        gl!.uniform1f(uLoc('uDiskAlpha'), params.diskAlpha);
        gl!.uniform1f(uLoc('uDiskTemp'), params.diskTemp);
        gl!.uniform1f(uLoc('uDiskHeight'), params.diskHeight);

        // Rendering Quality
        gl!.uniform1i(uLoc('uSteps'), params.steps);
        gl!.uniform1i(uLoc('uGrid'), params.showGrid ? 1 : 0);
        gl!.uniform1i(uLoc('uDebug'), params.showDebug ? 1 : 0);
        gl!.uniform1f(uLoc('uBloomIntensity'), params.bloomIntensity);

        // Motion
        gl!.uniform1i(uLoc('uEnableMotion'), params.enableMotion ? 1 : 0);
        gl!.uniform1f(uLoc('uGridInfallSpeed'), params.gridInfallSpeed);
        gl!.uniform1f(uLoc('uGridSwirlSpeed'), params.gridSwirlSpeed);
        gl!.uniform1f(uLoc('uDiskRotationSpeed'), params.diskRotationSpeed);
        gl!.uniform1f(uLoc('uDiskTurbulence'), params.diskTurbulence);
        gl!.uniform1i(uLoc('uPhotonRingShimmer'), params.photonRingShimmer ? 1 : 0);

        // Orbiter
        gl!.uniform1i(uLoc('uEnableOrbiter'), params.enableOrbiter ? 1 : 0);
        gl!.uniform3fv(uLoc('uOrbiterPos'), orbiter.position);
        gl!.uniform1f(uLoc('uOrbiterRadius'), params.orbiterRadius);
        gl!.uniform3fv(uLoc('uOrbiterColor'), params.orbiterColor);
        gl!.uniform1i(uLoc('uOrbiterType'), params.orbiterType);

        quad.draw(program);
    }

    requestAnimationFrame(loop);
}

// Global Error Handler for user visibility
window.addEventListener('error', (e) => {
    const errDiv = document.createElement('div');
    errDiv.style.position = 'absolute';
    errDiv.style.top = '0';
    errDiv.style.left = '0';
    errDiv.style.background = 'rgba(255,0,0,0.8)';
    errDiv.style.color = 'white';
    errDiv.style.padding = '20px';
    errDiv.style.zIndex = '9999';
    errDiv.innerText = `ERROR: ${e.message}`;
    document.body.appendChild(errDiv);
});

main().catch(e => {
    console.error(e);
    const errDiv = document.createElement('div');
    errDiv.style.position = 'absolute';
    errDiv.style.top = '0';
    errDiv.style.left = '0';
    errDiv.style.background = 'rgba(255,0,0,0.8)';
    errDiv.style.color = 'white';
    errDiv.style.padding = '20px';
    errDiv.style.zIndex = '9999';
    errDiv.innerText = `INIT ERROR: ${e.message}`;
    document.body.appendChild(errDiv);
});
