# Centered Hero Viewport & 3D Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the homepage Hero Section to implement a centered layout with a horizontal carousel of three 3D slots (Left, Center, Right) where background models are blurred with glassmorphic outlines and Spline background elements are dynamically hidden.

**Architecture:**
- **`Hero3DStage`**: Accept `removeSplineBg` parameter. If true, in the Spline `onLoad` handler, inspect loaded objects and hide background, floor, text, and card nodes.
- **`HeroSection`**: Redesign layout to stack typography centered at the top. Below the text, render the three-slot horizontal stage with left/right carousel arrows and click-to-rotate triggers.

---

### Task 1: Update Hero3DStage to Support Background Hiding

**Files:**
- Modify: [Hero3DStage.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/Hero3DStage.tsx)

- [ ] **Step 1: Add prop and implement Spline filter cleaning**
Modify `src/components/Hero3DStage.tsx` to add `removeSplineBg` to the props and implement the dynamic cleaning routine in the Spline render block.

```tsx
interface Hero3DStageProps {
  sceneUrl: string;
  isActive: boolean;
  materialType: string;
  removeSplineBg: boolean;
  onLoaded: () => void;
}
```

Implement the `handleLoad` logic for Spline:
```tsx
  const handleSplineLoad = (splineApp: any) => {
    if (removeSplineBg) {
      try {
        const objects = splineApp.getObjects();
        objects.forEach((obj: any) => {
          const name = obj.name.toLowerCase();
          if (
            name.includes('card') ||
            name.includes('glass') ||
            name.includes('text') ||
            name.includes('plane') ||
            name.includes('floor') ||
            name.includes('wall') ||
            name.includes('bg') ||
            name.includes('back') ||
            name.includes('base') ||
            name.includes('r4x') ||
            name.includes('spline')
          ) {
            obj.visible = false;
          }
        });
      } catch (err) {
        console.warn('Failed to clean Spline background', err);
      }
    }
    onLoaded();
  };
```

- [ ] **Step 2: Commit Task 1**

```bash
git add src/components/Hero3DStage.tsx
git commit -m "feat: add support for removing Spline background elements in Hero3DStage"
```

---

### Task 2: Redesign HeroSection into Centered Carousel

**Files:**
- Modify: [HeroSection.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/HeroSection.tsx)

- [ ] **Step 1: Overwrite HeroSection.tsx with centered carousel layout**
Redesign the layout, states, and admin panel to support three distinct slots and carousel styling.

- [ ] **Step 2: Verify compiling**
Run: `npm run build`
Expected: Builds successfully with zero TypeScript or PostCSS issues.

- [ ] **Step 3: Commit Task 2**

```bash
git add src/components/HeroSection.tsx
git commit -m "feat: complete HeroSection centered 3D model carousel redesign with glassmorphism blur and admin settings"
```

---

### Task 3: Verification & Polish

- [ ] **Step 1: Test locally**
Start dev server and check visual styles, model transitions, and drag-and-drop operations at `http://localhost:3000`.
