import { vec3 } from 'gl-matrix';
import { SimulationParams } from './params';

export class Orbiter {
    position: vec3 = vec3.create();
    velocity: vec3 = vec3.create();
    active: boolean = false;

    constructor() {
        this.reset(new SimulationParams()); // Init with defaults
    }

    reset(params: SimulationParams) {
        // Start at a random angle in the XZ plane at radius 'orbiterDist'
        const angle = Math.random() * Math.PI * 2;
        const r = params.orbiterDist;

        vec3.set(this.position,
            r * Math.cos(angle),
            0,
            r * Math.sin(angle)
        );

        // Circular orbit velocity: v = sqrt(GM / r)
        // We want slightly elliptical or eccentric if desired
        // Tangent vector
        const tangent = vec3.fromValues(-Math.sin(angle), 0, Math.cos(angle));

        // Velocity magnitude
        // M = params.mass (Schwarzschild R_s = 2M, so G=1, c=1 units imply M = R_s/2 ?)
        // In our shader we use Rs = 2 * Mass. Let's assume G=1.
        // v_circ = sqrt(M / r)
        // params.mass is actually half-rs.
        const vCirc = Math.sqrt(params.mass / r);

        // Add eccentricity implicitly by modifying velocity
        // params.orbiterVel is a multiplier on circular velocity? Or absolute? Let's treat as multiplier for ease.
        // Actually let's assume params.orbiterVel is "Circular Velocity Factor" where 1.0 = circular.
        const speed = vCirc * (0.8 + Math.random() * 0.4); // Randomize slighty

        vec3.scale(this.velocity, tangent, speed);

        // Add random inclination
        this.velocity[1] = (Math.random() - 0.5) * 0.1 * speed;
        this.position[1] = (Math.random() - 0.5) * 0.5;

        this.active = params.enableOrbiter;
    }

    update(dt: number, params: SimulationParams) {
        if (!params.enableOrbiter) {
            this.active = false;
            return;
        }
        this.active = true;

        const rVec = vec3.create();
        vec3.copy(rVec, this.position);
        const r = vec3.length(rVec);
        const rs = 2.0 * params.mass;

        if (r < rs) {
            // Swallowed
            // Don't disable immediately to avoid flicker, just clamp or reset?
            // Let's reset for continuous show.
            this.reset(params);
            // Push it out to start
            return;
        }

        // Newton Gravity: F = -GM/r^2 * r_hat
        // a = -GM/r^3 * r_vec
        // Pseudo-Newtonian potential for Schwarzschild: F = -GM/r^2 * (1 - Rs/r)^-something?
        // Let's stick to Newton + Precession term: F ~ 1/r^2 + 1/r^3

        const r2 = r * r;
        const r3 = r2 * r;

        const G = 1.0;
        const M = params.mass;

        // Newtonian acceleration
        const accel = vec3.create();
        vec3.scale(accel, rVec, -G * M / r3);

        // General Relativity Precession term (approximate)
        // F_GR ~ -3GM(L^2) / c^2 r^4 ... 
        // Let's mostly just stick to Newtonian but add "Drag" to force inspiral.

        // Drag: F_drag = -k * v * density?
        // density at this radius? 
        // Let's just use explicit drag parameter
        if (params.orbiterDrag > 0) {
            const dragForce = vec3.create();
            vec3.scale(dragForce, this.velocity, -params.orbiterDrag * 0.1);
            vec3.add(accel, accel, dragForce);
        }

        // Integration (Semi-implicit Euler)
        const dv = vec3.create();
        vec3.scale(dv, accel, dt);
        vec3.add(this.velocity, this.velocity, dv);

        const dx = vec3.create();
        vec3.scale(dx, this.velocity, dt);
        vec3.add(this.position, this.position, dx);
    }
}
