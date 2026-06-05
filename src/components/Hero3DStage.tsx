import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface Hero3DStageProps {
  sceneUrl: string;
  isActive: boolean;
  materialType: string;
  removeSplineBg: boolean;
  onLoaded: () => void;
}

export default function Hero3DStage({ sceneUrl, isActive, materialType, removeSplineBg, onLoaded }: Hero3DStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSpline, setIsSpline] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check file type
  useEffect(() => {
    if (!sceneUrl) return;
    const isSplineFile = sceneUrl.includes('.splinecode') || (
      !sceneUrl.endsWith('.glb') && 
      !sceneUrl.endsWith('.gltf') && 
      !sceneUrl.endsWith('.stl') && 
      !sceneUrl.endsWith('.obj') &&
      !sceneUrl.startsWith('blob:') // Blobs are handled as standard models
    );
    setIsSpline(isSplineFile);
  }, [sceneUrl]);

  // Three.js Logic for GLB / STL / OBJ
  useEffect(() => {
    if (isSpline || !containerRef.current) return;
    
    let scene = new THREE.Scene();
    scene.background = null; // transparent background

    // Camera
    let camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);

    // Renderer
    let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf5af19, 0.5); // Brand gold light
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Setup material based on preference
    let customMaterial: THREE.Material;

    if (materialType === 'Reflective Gold Chrome') {
      customMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf5af19, // Gold
        roughness: 0.08,
        metalness: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      });
    } else if (materialType === 'Ghost Glass (Semi-Transparent)') {
      customMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.9,
        opacity: 0.35,
        transparent: true
      });
    } else if (materialType === 'Cyberpunk Hologram Wireframe') {
      customMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5af19,
        wireframe: true,
        emissive: new THREE.Color(0xf5af19),
        emissiveIntensity: 0.5
      });
    } else {
      // Default: Matte Slate / Carbon
      customMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.7,
        metalness: 0.2
      });
    }

    let loadedObject: THREE.Object3D | null = null;

    const applyMaterial = (object: THREE.Object3D) => {
      if (materialType === 'Original Embedded Textures') return;
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = customMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    };

    const centerAndScaleObject = (object: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Center
      object.position.x += (object.position.x - center.x);
      object.position.y += (object.position.y - center.y);
      object.position.z += (object.position.z - center.z);

      // Scale
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 4.0;
      const scale = targetSize / maxDim;
      object.scale.set(scale, scale, scale);

      scene.add(object);
      loadedObject = object;
      onLoaded();
    };

    // Detect format from URL or check if it's a blob and try GLTF loader first
    const isBlob = sceneUrl.startsWith('blob:');
    let format = '';
    if (isBlob) {
      // For blob, we can try to guess or we can parse file metadata if we passed name.
      // But since we only have the URL, we'll try to load as GLTF first.
      format = 'glb'; 
    } else {
      format = sceneUrl.split('.').pop()?.toLowerCase() || '';
    }

    const loadSTL = () => {
      const loader = new STLLoader();
      loader.load(sceneUrl, (geometry) => {
        const mesh = new THREE.Mesh(geometry, customMaterial);
        centerAndScaleObject(mesh);
      }, undefined, (err) => setError('Failed to load STL file.'));
    };

    const loadOBJ = () => {
      const loader = new OBJLoader();
      loader.load(sceneUrl, (obj) => {
        applyMaterial(obj);
        centerAndScaleObject(obj);
      }, undefined, (err) => setError('Failed to load OBJ file.'));
    };

    const loadGLTF = () => {
      const loader = new GLTFLoader();
      loader.load(sceneUrl, (gltf) => {
        applyMaterial(gltf.scene);
        centerAndScaleObject(gltf.scene);
      }, undefined, (err) => {
        // If it's a blob and failed GLTF, try STL or OBJ
        if (isBlob) {
          // Attempt STL
          const stlLoader = new STLLoader();
          stlLoader.load(sceneUrl, (geometry) => {
            const mesh = new THREE.Mesh(geometry, customMaterial);
            centerAndScaleObject(mesh);
          }, undefined, () => {
            // Attempt OBJ
            const objLoader = new OBJLoader();
            objLoader.load(sceneUrl, (obj) => {
              applyMaterial(obj);
              centerAndScaleObject(obj);
            }, undefined, () => setError('Failed to load 3D file formats.'));
          });
        } else {
          setError('Failed to load GLTF model.');
        }
      });
    };

    if (format === 'stl') {
      loadSTL();
    } else if (format === 'obj') {
      loadOBJ();
    } else {
      loadGLTF();
    }

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (loadedObject) {
        loadedObject.rotation.y += 0.005; // Gentle auto-rotate
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [sceneUrl, isSpline, materialType]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 bg-bg-surface/50 text-red-400 font-mono text-[10px]">
        {error}
      </div>
    );
  }

  const handleSplineLoad = (splineApp: any) => {
    if (removeSplineBg) {
      try {
        const objects: any[] = [];
        if (splineApp.scene) {
          splineApp.scene.traverse((obj: any) => {
            if (obj.name) {
              objects.push(obj);
            }
          });
        }
        console.log('SPLINE OBJECTS IN SCENE:', objects.map((o: any) => `${o.name} (${o.type})`));
        (window as any).splineObjects = objects.map((o: any) => o.name);
        
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

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
        isActive ? 'opacity-100 scale-100 filter-none pointer-events-auto' : 'opacity-0 scale-95 blur-md pointer-events-none'
      }`}
    >
      {isSpline && (
        <Suspense fallback={<div className="absolute inset-0 bg-[#080c14] animate-pulse" />}>
          <Spline
            scene={sceneUrl}
            onLoad={handleSplineLoad}
            style={{ width: '100%', height: '100%' }}
          />
        </Suspense>
      )}
    </div>
  );
}
