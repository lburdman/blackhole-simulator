export class SimulationParams {
    mass: number = 1.0;
    spin: number = 0.0;

    // Camera default
    camDistance: number = 10.0;

    // Disk
    diskInner: number = 2.6; // Should be > ISCO ideally, but adjustable
    diskOuter: number = 12.0;
    diskAlpha: number = 1.0;
    diskTemp: number = 1.0;
    diskHeight: number = 0.1;

    // Render
    steps: number = 300; // Raymarching steps
    showGrid: boolean = false;
    showDebug: boolean = false;
    bloomIntensity: number = 0.5;

    // Simulation
    paused: boolean = false;
    time: number = 0.0; // Internal time tracking

    // Motion
    enableMotion: boolean = true;
    gridInfallSpeed: number = 0.5;
    gridSwirlSpeed: number = 1.0;
    diskRotationSpeed: number = 0.5; // Multiplier
    diskTurbulence: number = 0.2;
    photonRingShimmer: boolean = true;

    // Orbiter
    enableOrbiter: boolean = false;
    orbiterType: number = 0; // 0 = Star, 1 = Planet
    orbiterRadius: number = 0.2;
    orbiterDist: number = 15.0;
    orbiterDrag: number = 0.05;
    orbiterColor: [number, number, number] = [3.0, 0.8, 0.4]; // HDR Color intensity
}
