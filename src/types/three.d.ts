/* eslint-disable */
// Minimal namespace + module shim for 'three' to satisfy local development without @types/three.
// Install official typings for full support: npm install --save-dev @types/three

declare namespace THREE {
  class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number; y: number; z: number;
    clone(): Vector3; add(v: Vector3): Vector3; addVectors(a: Vector3, b: Vector3): Vector3;
    multiplyScalar(s: number): Vector3; set(x: number, y: number, z: number): Vector3; copy(v: Vector3): Vector3;
    project(camera: PerspectiveCamera): Vector3; setScalar?(s:number):Vector3;
    sub(v: Vector3): Vector3; normalize(): Vector3; setFromSpherical?(s: Spherical): Vector3;
  }
  class Vector2 { constructor(x?: number, y?: number); x: number; y: number; }
  class Object3D {
    children: Object3D[]; position: Vector3; rotation: any; scale: Vector3;
    add(...o: Object3D[]): void; traverse(cb: (o: Object3D) => void): void;
  }
  class Group extends Object3D {}
  class Scene extends Object3D { background: any; fog: any; }
  class Color { constructor(v?: string | number); setHex(h:number):void; set(v:number|string):void; setHSL(h:number,s:number,l:number):void; getHex():number; }
  class FogExp2 { constructor(color: string|number, density: number); }
  class PerspectiveCamera extends Object3D { constructor(fov:number, aspect:number, near:number, far:number); aspect:number; fov:number; updateProjectionMatrix():void; lookAt(x:number,y:number,z:number):void; }
  class WebGLRenderer { constructor(params:any); domElement:HTMLCanvasElement; setPixelRatio(r:number):void; setSize(w:number,h:number):void; outputColorSpace:any; render(scene:Scene,camera:PerspectiveCamera):void; dispose():void; }
  class HemisphereLight extends Object3D { constructor(sky:number, ground:number, intensity:number); }
  class DirectionalLight extends Object3D { constructor(color:number, intensity:number); castShadow:boolean; }
  class PointLight extends Object3D { constructor(color:number,intensity?:number,distance?:number,decay?:number); }
  class BufferAttribute { constructor(array: ArrayLike<number>, itemSize:number); getY(i:number):number; setY(i:number,v:number):void; needsUpdate:boolean; }
  class BufferGeometry { setAttribute(name:string, attr:BufferAttribute):void; dispose():void; getAttribute(name:string):BufferAttribute; }
  class RingGeometry extends BufferGeometry { constructor(innerRadius:number, outerRadius:number, thetaSegments:number, phiSegments:number); }
  class BoxGeometry extends BufferGeometry { constructor(w:number,h:number,d:number); }
  class CylinderGeometry extends BufferGeometry { constructor(rTop:number,rBottom:number,height:number,radialSegs?:number,heightSegs?:number); }
  class SphereGeometry extends BufferGeometry { constructor(r:number, wSegs:number, hSegs:number); }
  class TubeGeometry extends BufferGeometry { constructor(path:CatmullRomCurve3, tubularSegments:number, radius:number, radialSegments:number, closed:boolean); }
  class MeshBasicMaterial { constructor(params:any); color: Color; }
  class MeshStandardMaterial { constructor(params:any); emissive: Color; color: Color; userData:any; clone():MeshStandardMaterial; emissiveIntensity?:number; }
  class PointsMaterial { constructor(params:any); }
  class Mesh extends Object3D { constructor(geo:BufferGeometry, mat:any); material:any; geometry:BufferGeometry; }
  class Points extends Object3D { constructor(geo:BufferGeometry, mat:any); }
  class CatmullRomCurve3 { constructor(points:Vector3[]); getPointAt(t:number):Vector3; }
  class Clock { getElapsedTime(): number; }
  class Raycaster { setFromCamera(v2:Vector2, camera:PerspectiveCamera):void; intersectObjects(objs:Object3D[], recursive:boolean): { object:Object3D }[]; }
  const SRGBColorSpace: any;
  const DoubleSide: number;
  class Box3 { constructor(min?:Vector3, max?:Vector3); setFromObject(o:Object3D):Box3; getCenter(target:Vector3):Vector3; getSize(target:Vector3):Vector3; expandByObject(o:Object3D):Box3; }
  class Spherical { constructor(radius?:number, phi?:number, theta?:number); radius:number; phi:number; theta:number; setFromVector3(v:Vector3):Spherical; }
  const MathUtils: { clamp(x:number, min:number, max:number):number };
}

declare module 'three' {
  export = THREE;
}