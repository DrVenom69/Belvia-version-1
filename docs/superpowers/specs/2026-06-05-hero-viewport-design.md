# 2026-06-05 Hero Viewport Design Specification

## Overview & Goals
Redesign the homepage Hero Section (`src/components/HeroSection.tsx`) to show two trending Spline 3D models sequentially with a cross-fade transition:
- **Scene 1 (First)**: `https://prod.spline.design/0Gj5CX-AhI9UHZgU/scene.splinecode`
- **Scene 2 (Second)**: `https://prod.spline.design/BeGRGjuilCpu6coy/scene.splinecode`

Build a unified drag-and-drop viewport that:
1. **Loads Hosted Scenes**: Renders Spline scenes by default.
2. **Accepts Local 3D Uploads**: Allows drag-and-drop of `.stl`, `.obj`, and `.glb` files.
3. **Applies Customizable Materials**: Enables selecting custom shaders/materials (Reflective Gold, Carbon Slate, Frosted Glass, Hologram, Original Textures) for untextured models.
4. **Persists Options**: Keeps active URLs, switch intervals, materials, and mobile bypass configuration in `localStorage`.
5. **Safeguards Mobile Performance**: Viewport widths under `640px` default to a static 3D stage fallback to avoid mobile device crashes, with a bypass switch in settings.

---

## 🏛️ Architectural Details

### 1. Hybrid 3D Renderer Component
A new component `Hero3DStage` (within `src/components/HeroSection.tsx` or a subcomponent) will handle mounting:
- **Spline Player**: Uses `@splinetool/react-spline` dynamically.
- **Three.js Canvas**: Mounted if the file/URL format is `.stl`, `.obj`, or `.glb`. Uses dynamic imports for `three` and its loaders to ensure fast initial page load times.

### 2. File Parsing & Loading Flow
1. **Drag-and-Drop Event**: Over the viewport or Admin settings panel.
2. **Blob URL Creation**: Use `URL.createObjectURL(file)` to generate a local path.
3. **Format Detection**:
   - `.splinecode` -> Loads in Spline player.
   - `.stl` -> Loaded via Three.js `STLLoader`.
   - `.obj` -> Loaded via Three.js `OBJLoader`.
   - `.glb` / `.gltf` -> Loaded via Three.js `GLTFLoader`.

### 3. Material/Shader Configurator Profiles
For untextured models (primarily `.stl` and `.obj`), Three.js renders a `MeshStandardMaterial` configured as:
- **Reflective Gold Chrome**: Color `#f5af19`, metalness `0.95`, roughness `0.08`, clearcoat `1.0`.
- **Matte Slate / Carbon**: Color `#1e293b`, metalness `0.20`, roughness `0.75`, bumpMap/texture for carbon fiber if available, or simple matte finish.
- **Ghost Glass (Semi-Transparent)**: Color `#ffffff`, metalness `0.10`, roughness `0.10`, transmission `0.90`, opacity `0.35`, transparent `true`.
- **Cyberpunk Hologram**: Wireframe mode `true`, color `#f5af19` (gold) or `#7b5ce5` (violet), with emissive glow and additive blending.
- **Original Embedded Textures**: Default mesh rendering, loading colors and textures embedded directly in `.glb` files.

### 4. Transition Logic
- The container maintains two overlay elements positioned absolutely.
- Auto-transition timer (default `6` seconds) toggles the active index (`0` or `1`).
- Classes are applied to fade the active screen:
  - **Active Canvas**: `opacity-100 scale-100 filter-none pointer-events-auto transition-all duration-1000 ease-in-out`
  - **Inactive/Background Canvas**: `opacity-0 scale-95 blur-md pointer-events-none transition-all duration-1000 ease-in-out`

---

## 🔧 User Configurable Settings (Local Storage)
All settings are stored in `localStorage` under the key `belvia_hero_viewport_config`:
```json
{
  "scene1": "https://prod.spline.design/0Gj5CX-AhI9UHZgU/scene.splinecode",
  "scene2": "https://prod.spline.design/BeGRGjuilCpu6coy/scene.splinecode",
  "switchDelay": 6,
  "material": "Matte Slate / Carbon",
  "bypassMobilePerformance": false
}
```

---

## 📱 Mobile Responsiveness & Fallbacks
- By default, if `window.innerWidth < 640`, 3D renderers are disabled.
- Fallback UI shows the interactive CSS-tilting Stage (the previous cube-based Stage containing an animated 3D grid layout) to prevent crashes.
- Admin Panel allows checking a box: `bypassMobilePerformance: true` which overrides the width-check and forces loading the 3D canvases.

---

## 🛠️ Verification & Test Plan
1. **Compilation**: Run `npm run build` to verify bundles compile without warnings.
2. **Spline Loading**: Verify both Scene 1 and Scene 2 load sequentially.
3. **Cross-Fade**: Test that after `switchDelay` seconds, Scene 1 fades out to blurred state and Scene 2 fades in.
4. **Drag-and-Drop**: Drop local `.glb`, `.stl`, and `.obj` files to verify that they parse, override the active model, and render correctly.
5. **Material Swapping**: Open the Settings Modal and switch between Gold Chrome, Matte Slate, Ghost Glass, and Hologram, confirming the rendering updates immediately.
6. **Mobile check**: Verify mobile viewport width `< 640px` shows the fallback stage, and checking the override option instantiates Three.js/Spline.
