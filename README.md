# WebGL2 Black Hole Simulation

A high-fidelity, physically-inspired black hole simulation rendering in the browser using WebGL2 and ray marching.

## 🚀 Setup & Run

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Build for Production**
    ```bash
    npm run build
    ```

## 🌌 Physics Model

This simulation renders a **Schwarzschild Black Hole** using a ray-marching approach in a GLSL fragment shader.

*   **Metric**: Schwarzschild (non-rotating, spherical).
*   **Ray Integration**: We integrate the path of light rays (null geodesics) through the curved spacetime. The light bending is approximated using the Newtonian deflection term scaled to match General Relativity predictions for weak-to-strong fields ($3M/r^4 \times L^2$).
*   **Accretion Disk**: A volumetric disk model with procedural noise, temperature gradients, and relativistic Doppler beaming approximations.
*   **Photon Sphere**: The "photon ring" (shadow boundary) emerges naturally from rays that orbit the black hole multiple times before being captured or escaping.

## 🎛 Controls

*   **Mouse Drag**: Orbit camera
*   **Scroll**: Zoom
*   **UI Panel**:
    *   **Physics**: Adjust Mass (Event Horizon size).
    *   **Disk**: Modify radii, temperature, and opacity.
    *   **Rendering**: quality settings (Ray steps) and debug modes.
*   **Shortcuts**:
    *   `Space`: Pause/Play
    *   `G`: Toggle Grid
    *   `P`: Screenshot

## 🛠 Tech Stack

*   **Vite**: Build tool & dev server
*   **TypeScript**: Type-safe logic
*   **WebGL2**: Raw rendering API
*   **GLSL**: Physics & Graphics logic
*   **lil-gui**: Control interface

*   **Motion**:
    *   **Accretion Disk**: Differential rotation (faster near the center) with turbulence.
    *   **Grid**: Spacetime grid texture drifts inward and swirls to visualize frame dragging.
    *   **Ring Shimmer**: Subtle energy fluctuation modulation on the photon ring.
    *   **Orbiter**: A dynamic secondary object (Star/Planet) that orbits and can be lensed by the black hole.

## ⚠️ Notes

*   **Performance**: The simulation is GPU-intensive. Increase `Ray Steps` for higher accuracy or decrease for better FPS.
*   **Browser**: Requires a browser with WebGL 2.0 and `EXT_color_buffer_float` support (Chrome, Firefox, Safari).

