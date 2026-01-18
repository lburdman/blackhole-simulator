export const vertSrc = `#version 300 es
layout(location = 0) in vec2 aPosition;

out vec2 vUv;

void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const fragSrc = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uResolution;
uniform float uTime;

// Camera
uniform vec3 uCamPos;
uniform vec3 uCamTarget;
uniform vec3 uCamUp;
uniform float uFov;

// Physics
uniform float uMass;
uniform float uSpin; // Placeholder for possible Kerr extension

// Disk
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uDiskAlpha;
uniform float uDiskTemp;
uniform float uDiskHeight; 

// Render
uniform int uSteps;
uniform bool uGrid;
uniform bool uDebug;
uniform float uBloomIntensity;

// Motion
uniform bool uEnableMotion;
uniform float uGridInfallSpeed;
uniform float uGridSwirlSpeed;
uniform float uDiskRotationSpeed;
uniform float uDiskTurbulence;
uniform bool uPhotonRingShimmer;

// Orbiter
uniform bool uEnableOrbiter;
uniform vec3 uOrbiterPos;
uniform float uOrbiterRadius;
uniform vec3 uOrbiterColor; // HDR RGB
uniform int uOrbiterType; // 0=Star, 1=Planet

#define PI 3.14159265359
#define MAX_DIST 100.0

// Simple noise for stars
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Procedural starfield with optional grid animation
vec3 getBackground(vec3 dir) {
    float n = noise(dir.xy * 200.0 + dir.z * 100.0);
    float star = smoothstep(0.98, 1.0, n);
    
    // Slight milky way band
    float band = noise(dir.xy * 2.0);
    vec3 color = vec3(star) * 2.0 + vec3(band * 0.05);

    // Grid
    if (uGrid) {
        // Project direction to sphere
        float theta = acos(dir.y);
        float phi = atan(dir.z, dir.x);
        
        // --- Grid Animation ---
        if (uEnableMotion) {
            float swirl = uTime * uGridSwirlSpeed * 0.1;
            phi += swirl;
            
            float infall = uTime * uGridInfallSpeed * 0.2;
             phi += infall * 0.5; // Combined drift
        }

        float gridLines = smoothstep(0.0, 0.02, abs(fract(phi * 3.0) - 0.5)) * 
                          smoothstep(0.0, 0.02, abs(fract(theta * 3.0) - 0.5));
        
        color += vec3(0.0, 0.2, 0.4) * (1.0 - gridLines);
    }
    
    return color;
}

// Check sphere intersection
// Returns distance to surface, -1 if no hit
float distSphere(vec3 p, vec3 center, float r) {
    return length(p - center) - r;
}

// Accretion disk density/color
// Returns vec4(color_rgb, density)
vec4 sampleDisk(vec3 pos) {
    float r = length(pos);
    if (r < uDiskInner || r > uDiskOuter) return vec4(0.0);
    
    // Vertical fade
    float h = abs(pos.y);
    float densityV = smoothstep(uDiskHeight, 0.0, h);
    
    // Radial fade (soft edges)
    float densityR = smoothstep(uDiskInner, uDiskInner + 0.5, r) * 
                     smoothstep(uDiskOuter, uDiskOuter - 2.0, r);
    
    float density = densityV * densityR;
    
    // Temperature gradient
    float temp = uDiskTemp / (r - uDiskInner + 0.5); 
    
    // --- Differential Rotation ---
    float angle = atan(pos.z, pos.x);
    if (uEnableMotion) {
        // Keplerian-ish speed: w ~ r^-1.5
        float speed = uDiskRotationSpeed * 5.0 * pow(r, -1.5);
        angle += uTime * speed;
    }

    // Blackbody-ish color
    vec3 color = vec3(1.0, 0.8, 0.5) * temp;
    color += vec3(0.5, 0.2, 0.1) * temp * temp; // Hotter = brighter core

    // Add noise to disk (rotating with the coordinate)
    float noiseScale = 2.0;
    if (uEnableMotion) {
        // Add subtle turbulence that morphs over time
        noiseScale += sin(uTime * 0.5) * uDiskTurbulence;
    }
    
    float diskNoise = noise(vec2(r * 2.0, angle * 5.0));
    
    // Turbulence detail
    if (uEnableMotion && uDiskTurbulence > 0.0) {
       float detail = noise(vec2(r * 4.0 - uTime, angle * 10.0));
       diskNoise = mix(diskNoise, detail, uDiskTurbulence);
    }

    density *= (0.5 + 0.5 * diskNoise);

    return vec4(color, density * uDiskAlpha);
}

void main() {
    // 1. Camera Setup
    float ar = uResolution.x / uResolution.y;
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= ar;

    vec3 camFwd = normalize(uCamTarget - uCamPos);
    vec3 camRight = normalize(cross(camFwd, uCamUp));
    vec3 camUp = cross(camRight, camFwd);
    
    // Tan(fov/2)
    float fovFactor = tan(radians(uFov) * 0.5);
    vec3 rayDir = normalize(camFwd + (uv.x * camRight + uv.y * camUp) * fovFactor);
    vec3 rayPos = uCamPos;

    // 2. Ray Marching (Curved Spacetime)
    vec3 accumColor = vec3(0.0);
    float transmittance = 1.0;
    
    vec3 p = rayPos;
    vec3 v = rayDir;
    
    bool horizonHit = false;
    bool objectHit = false;
    float rs = 2.0 * uMass;
    
    // Closest approach for photon ring glow
    float minR = 1e5;

    for (int i = 0; i < uSteps; i++) {
        float r = length(p);
        minR = min(minR, r);
        
        float dt = max(0.02, r * 0.05);
        if (dt > 0.5) dt = 0.5;

        // -- Orbiter Check --
        if (uEnableOrbiter) {
             float dObj = length(p - uOrbiterPos);
             // Simple hit test suitable for stepping
             // If we step *through* the object, we might miss it if step is too big
             // but object is roughly 0.2, dt is adaptive.
             // If dObj < radius, we are inside.
             // For a solid render, we stop.
             // For a glowy star, we accumulate.
             
             if (dObj < uOrbiterRadius) {
                 // Hit object!
                 objectHit = true;
                 
                 vec3 objColor;
                 if (uOrbiterType == 0) { // Star
                     // Emissive, brighter at center
                     float core = 1.0 - (dObj / uOrbiterRadius);
                     objColor = uOrbiterColor * (1.0 + core * 5.0);
                 } else { // Planet
                     // Lit by... well, let's say simple ambient + fake Rim
                     vec3 normal = normalize(p - uOrbiterPos);
                     float NdotV = max(0.0, dot(normal, -v)); // Rim
                     // Simple shading
                     objColor = uOrbiterColor * 0.1 + uOrbiterColor * NdotV;
                 }
                 
                 accumColor += objColor * transmittance;
                 transmittance = 0.0; // Opaque
                 break;
             }
             
             // Add glow if close to star?
             if (uOrbiterType == 0 && dObj < uOrbiterRadius * 3.0) {
                 float glow = 1.0 / (dObj * dObj);
                 accumColor += uOrbiterColor * glow * 0.01 * dt * transmittance;
             }
        }
        
        // Disk Integration
        if (abs(p.y) < uDiskHeight * 2.0 && r < uDiskOuter && r > uDiskInner) {
             vec4 diskSample = sampleDisk(p);
             float segmentDensity = diskSample.a * dt; 
             accumColor += diskSample.rgb * segmentDensity * transmittance;
             transmittance *= (1.0 - segmentDensity);
             
             if (transmittance < 0.01) break;
        }

        if (r < rs) {
            horizonHit = true;
            break;
        }
        
        // Gravity (Refraction)
        float r2 = dot(p, p);
        float r4 = r2 * r2;
        vec3 L = cross(p, v);
        float L2 = dot(L, L);
        
        // 3 * M * L^2 / r^5 * vector_p
        // 1.0 works well visually for "Newtonian * 2" effect roughly
        vec3 accel = -3.0 * uMass * L2 * p / (r4 * length(p));
        
        v += accel * dt;
        v = normalize(v);
        p += v * dt;
        
        if (length(p) > MAX_DIST) break;
    }
    
    // 3. Background
    vec3 bgColor = vec3(0.0);
    if (!horizonHit && !objectHit && transmittance > 0.0) {
        bgColor = getBackground(v);
    }
    
    accumColor += bgColor * transmittance;
    
    // 4. Photon Ring Shimmer / Glow
    float photonSphere = 1.5 * rs;
    if (!horizonHit && minR < photonSphere * 1.5) {
        float glow = exp(-(minR - photonSphere) * 5.0); // Sharp peak
        vec3 glowColor = vec3(0.8, 0.6, 0.4);
        
        if (uEnableMotion && uPhotonRingShimmer) {
             // Subtle time oscillation
             float shimmer = 1.0 + 0.1 * sin(uTime * 5.0 + gl_FragCoord.x * 0.01);
             glow *= shimmer;
        }
        
        accumColor += glowColor * glow * 0.2 * transmittance;
    }
    
    // Post-processing
    accumColor = pow(accumColor, vec3(1.0/2.2));
    
    if (uDebug) {
        fragColor = vec4(v * 0.5 + 0.5, 1.0);
    } else {
        fragColor = vec4(accumColor, 1.0);
    }
}
`;
