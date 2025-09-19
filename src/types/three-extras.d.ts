declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import * as THREE from 'three';
  export class OrbitControls {
    constructor(object: THREE.Camera, domElement?: HTMLElement);
    enabled: boolean;
    target: THREE.Vector3;
    enableDamping: boolean;
    dampingFactor: number;
    minDistance: number; maxDistance: number;
    maxPolarAngle: number; minPolarAngle: number;
    update(): void;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  import * as THREE from 'three';
  export interface GLTF { scene: THREE.Group; animations: THREE.AnimationClip[] }
  export class GLTFLoader {
    load(url: string, onLoad: (gltf: GLTF) => void, onProgress?: (e: ProgressEvent<EventTarget>) => void, onError?: (err: unknown) => void): void;
  }
}

declare module 'three/examples/jsm/loaders/RGBELoader.js' {
  import * as THREE from 'three';
  export class RGBELoader {
    load(url: string, onLoad: (texture: THREE.DataTexture) => void, onProgress?: (e: ProgressEvent<EventTarget>) => void, onError?: (err: unknown) => void): void;
  }
}

declare module 'three/examples/jsm/postprocessing/EffectComposer.js' {
  import * as THREE from 'three';
  export class EffectComposer {
    constructor(renderer: any);
    addPass(pass: any): void;
    render(): void;
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass.js' {
  export class RenderPass { constructor(scene: any, camera: any); }
}

declare module 'three/examples/jsm/postprocessing/OutlinePass.js' {
  import * as THREE from 'three';
  export class OutlinePass {
    constructor(resolution: THREE.Vector2, scene: any, camera: any);
    edgeStrength: number; edgeGlow: number; edgeThickness: number; pulsePeriod: number;
    visibleEdgeColor: { set(color:string):void };
    hiddenEdgeColor: { set(color:string):void };
    selectedObjects: any[];
  }
}