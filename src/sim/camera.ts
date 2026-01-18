import { vec3, mat4 } from 'gl-matrix';

export class Camera {
    position: vec3 = vec3.create();
    target: vec3 = vec3.create(); // 0,0,0
    up: vec3 = vec3.fromValues(0, 1, 0);

    // Spherical coordinates
    radius: number = 11.0;
    theta: number = Math.PI / 2; // Polar angle (from up)
    phi: number = 0;   // Azimuthal angle

    fov: number = 45.0; // Degrees

    private isDragging = false;
    private lastMouseX = 0;
    private lastMouseY = 0;

    constructor(element: HTMLElement) {
        this.updatePosition();

        element.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            const sensitivity = 0.005;
            this.phi -= dx * sensitivity;
            this.theta = Math.max(0.01, Math.min(Math.PI - 0.01, this.theta - dy * sensitivity));

            this.updatePosition();
        });

        element.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.radius *= (1 + e.deltaY * 0.001);
            this.radius = Math.max(1.5, Math.min(100.0, this.radius));
            this.updatePosition();
        }, { passive: false });
    }

    updatePosition() {
        // Convert Num/Phi/Theta to Cartesian
        // y is up
        const y = this.radius * Math.cos(this.theta);
        const rSinTheta = this.radius * Math.sin(this.theta);
        const x = rSinTheta * Math.sin(this.phi);
        const z = rSinTheta * Math.cos(this.phi);

        vec3.set(this.position, x, y, z);
    }

    update() {
        // Any continuous updates if needed
    }
}
