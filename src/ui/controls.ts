import GUI from 'lil-gui';
import { SimulationParams } from '../sim/params';
import { Camera } from '../sim/camera';

export function initControls(params: SimulationParams, camera: Camera, canvas: HTMLCanvasElement) {
    const gui = new GUI({ title: 'Black Hole Controls' });
    const container = document.getElementById('ui-container');
    if (container) container.appendChild(gui.domElement);

    const physicsFolder = gui.addFolder('Phyiscs');
    physicsFolder.add(params, 'mass', 0.1, 5.0).name('Mass (M)');
    physicsFolder.add(params, 'spin', 0.0, 0.99).name('Spin (a) [Approx]');
    physicsFolder.open();

    const diskFolder = gui.addFolder('Accretion Disk');
    diskFolder.add(params, 'diskInner', 1.0, 10.0).name('Inner Radius');
    diskFolder.add(params, 'diskOuter', 5.0, 30.0).name('Outer Radius');
    diskFolder.add(params, 'diskHeight', 0.0, 2.0).name('Height');
    diskFolder.add(params, 'diskTemp', 0.1, 5.0).name('Temperature');
    diskFolder.add(params, 'diskAlpha', 0.0, 2.0).name('Opacity');
    diskFolder.open();

    const renderFolder = gui.addFolder('Rendering');
    renderFolder.add(params, 'steps', 100, 1000).step(10).name('Ray Steps');
    renderFolder.add(params, 'bloomIntensity', 0.0, 2.0).name('Bloom');
    renderFolder.add(params, 'showGrid').name('Show Grid');
    renderFolder.add(params, 'showDebug').name('Debug Mode');

    const motionFolder = gui.addFolder('Motion');
    motionFolder.add(params, 'enableMotion').name('Enable Motion');
    motionFolder.add(params, 'gridInfallSpeed', 0.0, 2.0).name('Grid Infall');
    motionFolder.add(params, 'gridSwirlSpeed', 0.0, 5.0).name('Grid Swirl');
    motionFolder.add(params, 'diskRotationSpeed', 0.0, 3.0).name('Disk Rotation');
    motionFolder.add(params, 'diskTurbulence', 0.0, 1.0).name('Disk Turbulence');
    motionFolder.add(params, 'photonRingShimmer').name('Ring Shimmer');
    motionFolder.open();

    const orbiterFolder = gui.addFolder('Orbiter (Star/Planet)');
    orbiterFolder.add(params, 'enableOrbiter').name('Enable Object');
    orbiterFolder.add(params, 'orbiterType', { Star: 0, Planet: 1 }).name('Type');
    orbiterFolder.add(params, 'orbiterDist', 3.0, 20.0).name('Initial Dist').onChange(() => {
        // We'll hook this up to reset in main or here if we had access to orbiter instance
    });
    orbiterFolder.add(params, 'orbiterRadius', 0.05, 1.0).name('Size');
    orbiterFolder.add(params, 'orbiterDrag', 0.0, 0.5).name('Inspiral Rate');
    orbiterFolder.addColor(params, 'orbiterColor').name('Color (HDR)');
    orbiterFolder.add({
        resetOrbit: () => {
            if ((params as any)._resetOrbit) (params as any)._resetOrbit();
        }
    }, 'resetOrbit').name('Reset Orbit');
    // Note: To cleanly reset from here we need access to the Orbiter instance. 
    // We'll implement a 'shouldResetOrbiter' flag in params or just expose the reset function differently.

    const metaFolder = gui.addFolder('Meta');
    metaFolder.add(params, 'paused').name('Paused');
    metaFolder.add({
        reset: () => {
            // Reset params handled by main loop re-reading params, 
            // but here we might want to reset camera or specific defaults
            camera.radius = 11.0;
            camera.theta = Math.PI / 2;
            camera.phi = 0;
            camera.updatePosition();
        }
    }, 'reset').name('Reset Camera');

    metaFolder.add({
        screenshot: () => {
            const link = document.createElement('a');
            link.download = `blackhole_${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    }, 'screenshot').name('Screenshot');

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.key === ' ') params.paused = !params.paused;
        if (e.key.toLowerCase() === 'g') params.showGrid = !params.showGrid;
        if (e.key.toLowerCase() === 'p') {
            const link = document.createElement('a');
            link.download = `blackhole_${Date.now()}.png`;
            // Need to ensure we render one frame before capturing if paused? 
            // Canvas holds last frame, so straightforward.
            link.href = canvas.toDataURL();
            link.click();
        }
        gui.controllersRecursive().forEach(c => c.updateDisplay());
    });
}
