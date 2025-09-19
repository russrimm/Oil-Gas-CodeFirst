/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

export interface AssemblyExplodedSceneProps {
  focus?: string | null;
  onSelect?: (key: string) => void;
  onReady?: (api: { capture: () => string }) => void;
  brightness?: number;
}

interface Part { key: string; group: THREE.Group; finalPos: THREE.Vector3; explodedPos: THREE.Vector3 }

export function AssemblyExplodedScene({ focus = null, onSelect, onReady, brightness = 1.0 }: AssemblyExplodedSceneProps) {
  const containerRef = useRef<HTMLDivElement|null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer|null>(null);
  const requestRef = useRef<number|null>(null);
  const onSelectRef = useRef(onSelect); useEffect(()=> { onSelectRef.current = onSelect; }, [onSelect]);
  const onReadyRef = useRef(onReady); useEffect(()=> { onReadyRef.current = onReady; }, [onReady]);
  const partsRef = useRef<Part[]>([]);
  // Separate spin group reference for impeller so only visual rotation occurs (no positional drift)
  const impellerSpinRef = useRef<THREE.Group|null>(null);
  const impellerTextureRef = useRef<any>(null);
  // Start in assembled state so the action button correctly offers to "Explode"
  const INITIAL_EXPLODED = false;
  const [isExploded, setIsExploded] = useState(INITIAL_EXPLODED);
  const assemblingRef = useRef<gsap.core.Tween[]|null>(null);
  const lightRefs = useRef<{ hemi?: THREE.HemisphereLight; key?: THREE.DirectionalLight }>({});

  // Focus highlight
  useEffect(() => {
    const parts = partsRef.current;
    parts.forEach(p => {
      p.group.traverse((o:any) => {
        if (o.isMesh && o.material && o.material.emissive) {
          const m = o.material as THREE.MeshStandardMaterial & { userData:any };
          if (m.userData.__origE !== undefined) {
            m.emissive.setHex(m.userData.__origE);
            (m as any).emissiveIntensity = m.userData.__origEI;
          }
        }
      });
    });
    if (focus) {
      const tgt = parts.find(p => p.key === focus);
      if (tgt) {
        const highlightHex = 0xffa640; // warm amber (better detail retention vs. saturated blue)
        tgt.group.traverse((o:any) => {
          if (o.isMesh && o.material && o.material.emissive) {
            const m = o.material as THREE.MeshStandardMaterial & { userData:any };
            if (m.userData.__origE === undefined) {
              m.userData.__origE = m.emissive.getHex?.() ?? 0x000000;
              m.userData.__origEI = (m as any).emissiveIntensity ?? 1;
            }
            // Blend original emissive with highlight to preserve some underlying tone
            try {
              const orig = new THREE.Color(m.userData.__origE);
              const hl = new THREE.Color(highlightHex);
              orig.lerp(hl, 0.65); // 65% toward highlight color
              m.emissive.set(orig);
            } catch {
              m.emissive.setHex(highlightHex);
            }
            (m as any).emissiveIntensity = Math.min((m.userData.__origEI ?? 0.3) + 0.25, 0.75); // modest bump only
          }
        });
        // Gentle pulse (slightly reduced scale to avoid obscuring edges)
        gsap.fromTo(tgt.group.scale, { x:1, y:1, z:1 }, { x:1.04, y:1.04, z:1.04, yoyo:true, repeat:1, duration:0.55, ease:'sine.inOut' });
      }
    }
  }, [focus]);

  function toggleAssembly() {
    const parts = partsRef.current;
    if (!parts.length) return;
    // Kill any running tweens
    assemblingRef.current?.forEach(t => t.kill());
    const tweens: gsap.core.Tween[] = [];
    const dur = 1.4; const ease = 'power3.inOut';
    parts.forEach((p,i) => {
      const target = isExploded ? p.finalPos : p.explodedPos;
      tweens.push(gsap.to(p.group.position, { x: target.x, y: target.y, z: target.z, duration: dur, delay: i*0.08, ease }));
    });
    assemblingRef.current = tweens;
    setIsExploded(e => !e);
  }

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const w = el.clientWidth; const h = el.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#060d13');
    // Tunable vertical centerline for rotating shaft & related components
  const CENTERLINE_Y = 3.5; // base centerline for rotating equipment
  const SHAFT_Y_ADJUST = 0.0; // (deprecated) vertical tweak no longer needed after axial realignment
    const camera = new THREE.PerspectiveCamera(55, w/h, 0.1, 200);
  camera.position.set(16, 7, 16); camera.lookAt(0,2.6,0);
    const renderer = new THREE.WebGLRenderer({ antialias:true });
    (renderer as any).outputColorSpace = THREE.SRGBColorSpace;
    (renderer as any).toneMapping = (THREE as any).ACESFilmicToneMapping;
    (renderer as any).toneMappingExposure = 1.1 * brightness;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(w,h); el.appendChild(renderer.domElement); rendererRef.current = renderer;
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.target.set(0,2,0); controls.update();

    // Lights
    const hemi = new THREE.HemisphereLight(0x9ec9ff, 0x16232c, 0.7*brightness); scene.add(hemi);
  const keyLight = new THREE.DirectionalLight(0xffe3c2, 1.25*brightness); keyLight.position.set(18,18,12); scene.add(keyLight);
  lightRefs.current = { hemi, key: keyLight };

    // Ground
    const ground = new THREE.Mesh(new (THREE as any).CylinderGeometry(30,30,0.2,72,1), new THREE.MeshStandardMaterial({ color:0x121e25, roughness:0.95, metalness:0.05 }));
    ground.position.y = -0.1; (ground as any).receiveShadow = true; scene.add(ground);

    const parts: Part[] = [];
    function addPart(key:string, mesh:THREE.Object3D, finalPos:THREE.Vector3, explodedOffset:THREE.Vector3) {
      const g = new THREE.Group(); g.add(mesh);
      // Place at final position if starting assembled; otherwise at exploded offset
      g.position.copy(INITIAL_EXPLODED ? explodedOffset : finalPos);
      scene.add(g);
      parts.push({ key, group:g, finalPos, explodedPos: explodedOffset.clone() });
    }

  // Materials tuned for slight contrast & roughness variance (pseudo PBR)
  const metal = new THREE.MeshStandardMaterial({ color:0xaab2b7, metalness:0.7, roughness:0.32, emissive:0x111a20, emissiveIntensity:0.38 });
  const steel = new THREE.MeshStandardMaterial({ color:0x7a858c, metalness:0.55, roughness:0.42, emissive:0x0d1418, emissiveIntensity:0.22 });
  const accent = new THREE.MeshStandardMaterial({ color:0xf29a22, metalness:0.62, roughness:0.38, emissive:0x3e2500, emissiveIntensity:0.5 });
  const sealMat = new THREE.MeshStandardMaterial({ color:0x2a3034, metalness:0.25, roughness:0.85, emissive:0x06090b, emissiveIntensity:0.18 });
  const darkHardware = new THREE.MeshStandardMaterial({ color:0x343c40, metalness:0.55, roughness:0.55, emissive:0x101517, emissiveIntensity:0.25 });

    // Procedural radial streak texture to give impeller a blurred rotational look
  function createImpellerTexture(): any {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0,0,size,size);
        const center = size/2;
        // Background transparent
        // Draw faint radial streaks
        for (let i=0;i<180;i++) {
          const ang = (Math.PI*2/180)*i;
            const len = center * (0.55 + Math.random()*0.35);
            const alpha = 0.02 + Math.random()*0.06; // subtle
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 1 + Math.random()*1.2;
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(center + Math.cos(ang)*len, center + Math.sin(ang)*len);
            ctx.stroke();
        }
        // Soft radial gradient vignette to fade edges
        const grad = ctx.createRadialGradient(center,center,0, center,center,center);
        grad.addColorStop(0,'rgba(255,255,255,0.25)');
        grad.addColorStop(0.5,'rgba(255,255,255,0.10)');
        grad.addColorStop(0.85,'rgba(255,255,255,0.02)');
        grad.addColorStop(1,'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(center,center,center,0,Math.PI*2); ctx.fill();
      }
  const CanvasTex: any = (THREE as any).CanvasTexture || (THREE as any).Texture;
  const tex = new CanvasTex(canvas);
  const repeatWrap = (THREE as any).RepeatWrapping ?? (THREE as any).ClampToEdgeWrapping;
  tex.wrapS = tex.wrapT = repeatWrap;
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      return tex;
    }
    const impellerTex = createImpellerTexture();
    impellerTextureRef.current = impellerTex;

    // Baseplate
    const baseGroup = new THREE.Group();
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(12,0.6,4.5), new THREE.MeshStandardMaterial({ color:0xe8b762, metalness:0.55, roughness:0.5, emissive:0x3a2807, emissiveIntensity:0.45 }));
    basePlate.position.y = 0.3; baseGroup.add(basePlate);
    // Mount pads (anchor holes as shallow recessed discs so they don't read as bolts in exploded view)
    for (let i=0;i<4;i++) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.25,24), steel.clone());
      pad.position.set(-4 + (i%2)*8, 0.55, -1.6 + (i>1?3.2:0));
      baseGroup.add(pad);
      const recessMat = darkHardware.clone(); (recessMat as any).metalness = 0.25; (recessMat as any).roughness = 0.75; (recessMat as any).emissiveIntensity = 0.12;
      const recess = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.045,24), recessMat);
      recess.position.set(pad.position.x, 0.55 + 0.25/2 - 0.03, pad.position.z);
      baseGroup.add(recess);
    }
    addPart('baseplate', baseGroup, new THREE.Vector3(0,0,0), new THREE.Vector3(-20,0,0));

    // Motor
    const motorGroup = new THREE.Group();
    const motorBody = new THREE.Mesh(new THREE.CylinderGeometry(2.3,2.3,6.6,56,1), accent.clone()); motorBody.rotation.z = Math.PI/2; motorGroup.add(motorBody);
    // Cooling fins (radial extrusions along body)
    for (let f=0; f<18; f++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25,1.2,0.08), accent.clone());
      fin.position.set(0,0,0);
      fin.rotation.x = (Math.PI*2/18)*f;
      fin.position.y = Math.sin(fin.rotation.x)*1.18;
      fin.position.z = Math.cos(fin.rotation.x)*1.18;
      motorGroup.add(fin);
    }
    const endBell = new THREE.Mesh(new THREE.CylinderGeometry(2.3,2.3,0.8,56,1), accent.clone()); endBell.rotation.z = Math.PI/2; endBell.position.x = 3.3; motorGroup.add(endBell);
  const endBell2 = (endBell as any).clone ? (endBell as any).clone() : new THREE.Mesh(new THREE.CylinderGeometry(2.3,2.3,0.8,56,1), accent.clone());
    endBell2.rotation.z = Math.PI/2; endBell2.position.x = -3.3; motorGroup.add(endBell2);
    const motorShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1.8,28), steel.clone()); motorShaft.rotation.z = Math.PI/2; motorShaft.position.x = 4.1; motorGroup.add(motorShaft);
  // Raised centerline using constant
  motorGroup.position.y = CENTERLINE_Y; addPart('motor', motorGroup, new THREE.Vector3(-2.4,CENTERLINE_Y,0), new THREE.Vector3(-11,CENTERLINE_Y,0));

    // Coupling (two hubs + sleeve)
  const coupling = new THREE.Group();
  const hub1 = new THREE.Mesh(new THREE.CylinderGeometry(0.95,0.95,1.1,36), metal.clone()); hub1.rotation.z = Math.PI/2; hub1.position.x = -1.05; coupling.add(hub1);
  const hub2 = (hub1 as any).clone ? (hub1 as any).clone() : new THREE.Mesh(new THREE.CylinderGeometry(0.95,0.95,1.1,36), metal.clone()); hub2.rotation.z = Math.PI/2; hub2.position.x = 1.05; coupling.add(hub2);
  // Flexible element teeth (alternating tabs)
  const flexGroup = new THREE.Group();
  for (let t=0;t<12;t++) { const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.5,0.4), steel.clone()); tooth.position.set(0,0,0); tooth.rotation.y = (Math.PI*2/12)*t; tooth.position.y = Math.sin(tooth.rotation.y)*0.0; tooth.position.z = Math.cos(tooth.rotation.y)*0.0; tooth.position.x = 0; flexGroup.add(tooth); }
  flexGroup.position.y = 0; coupling.add(flexGroup);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,1.0,40), steel.clone()); sleeve.rotation.z = Math.PI/2; coupling.add(sleeve);
  coupling.position.y = CENTERLINE_Y; addPart('coupling', coupling, new THREE.Vector3(0.8,CENTERLINE_Y,0), new THREE.Vector3(-2,CENTERLINE_Y,0));

    // Shaft (between coupling and impeller)
  // Shaft spans between coupling (x≈0.8) and impeller hub (x≈8.3); midpoint ≈4.55. Length increased to reduce gaps.
  const shaftGroup = new THREE.Group();
  const SHAFT_LENGTH = 7.8; // previously 6
  const shaftCore = new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,SHAFT_LENGTH,40), steel.clone());
  shaftCore.rotation.z = Math.PI/2; shaftGroup.add(shaftCore);
  const shaftKey = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.25,1.2), metal.clone());
  shaftKey.position.set(0,0.3,0); shaftGroup.add(shaftKey);
  const shaftCenterX = 4.55; // midpoint between coupling & impeller
  addPart('shaft', shaftGroup, new THREE.Vector3(shaftCenterX,CENTERLINE_Y + SHAFT_Y_ADJUST,0), new THREE.Vector3(shaftCenterX,CENTERLINE_Y + SHAFT_Y_ADJUST,0));

    // Seal (simple torus)
  const sealAssembly = new THREE.Group();
    let seal: any;
    try {
      seal = new THREE.Mesh(new (THREE as any).TorusGeometry(0.9,0.22,14,40), sealMat.clone());
      seal.rotation.y = Math.PI/2;
    } catch {
      seal = new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,0.25,40), sealMat.clone());
    }
  seal.rotation.y = Math.PI/2; sealAssembly.add(seal);
  const gland = new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,0.18,40), steel.clone()); gland.rotation.z = Math.PI/2; gland.position.x = 0.6; sealAssembly.add(gland);
  for (let b=0;b<6;b++) { const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.28,12), darkHardware.clone()); bolt.rotation.z = Math.PI/2; bolt.position.set(0.6, Math.sin((Math.PI*2/6)*b)*0.9, Math.cos((Math.PI*2/6)*b)*0.9); sealAssembly.add(bolt); }
  sealAssembly.position.y = CENTERLINE_Y;
  addPart('seal', sealAssembly, new THREE.Vector3(6.9,CENTERLINE_Y,0), new THREE.Vector3(10.5,CENTERLINE_Y,0));

    // Impeller (disk + blades) with internal spin group so only rotation, not translation, is animated
    const impellerGroup = new THREE.Group();
    const impellerSpin = new THREE.Group(); // child that will rotate
    const impellerMat = steel.clone();
    (impellerMat as any).map = impellerTex; (impellerMat as any).transparent = true; (impellerMat as any).opacity = 0.95;
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.9,1.9,0.55,60), impellerMat); disk.rotation.z = Math.PI/2; impellerSpin.add(disk);
    for (let b=0;b<7;b++) {
      const bladeMat = metal.clone(); (bladeMat as any).map = impellerTex; (bladeMat as any).transparent = true; (bladeMat as any).opacity = 0.9;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.25,1.2,0.6), bladeMat);
      const ang = b * (Math.PI*2/7);
      blade.position.set(0, Math.sin(ang)*0.95, Math.cos(ang)*0.95);
      blade.rotation.x = ang + Math.PI/6; // slight sweep
      blade.scale.z = 0.8;
      impellerSpin.add(blade);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,1.1,32), metal.clone()); hub.rotation.z = Math.PI/2; impellerSpin.add(hub);
    impellerGroup.add(impellerSpin);
  impellerGroup.position.y = CENTERLINE_Y; addPart('impeller', impellerGroup, new THREE.Vector3(8.3,CENTERLINE_Y,0), new THREE.Vector3(17,CENTERLINE_Y,0));
    impellerSpinRef.current = impellerSpin;

    // Housing (front cover + casing) simplified as two offset cylinders
  const housingGroup = new THREE.Group();
  const casing = new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.1,4.8,72,1), new THREE.MeshStandardMaterial({ color:0x4a5b64, metalness:0.48, roughness:0.58, emissive:0x141d22, emissiveIntensity:0.32 })); casing.rotation.z = Math.PI/2; housingGroup.add(casing);
  const front = new THREE.Mesh(new THREE.CylinderGeometry(3.25,3.25,0.85,72), steel.clone()); front.rotation.z = Math.PI/2; front.position.x = 2.4; housingGroup.add(front);
  // Discharge nozzle (pipe branch)
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,2.8,40), steel.clone()); nozzle.position.set(0,1.2,1.9); housingGroup.add(nozzle);
  const nozzleLip = new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,0.35,40), steel.clone()); nozzleLip.position.set(0,1.2,3.1); housingGroup.add(nozzleLip);
  housingGroup.position.y = CENTERLINE_Y; addPart('housing', housingGroup, new THREE.Vector3(11.4,CENTERLINE_Y,0), new THREE.Vector3(26,CENTERLINE_Y,0));

    // Fasteners (anchor bolts at each mounting pad instead of a linear row)
    const bolts = new THREE.Group();
    const padPositions = [
      new THREE.Vector3(-4, 0.55, -1.6), // front left
      new THREE.Vector3(4, 0.55, -1.6),  // front right
      new THREE.Vector3(-4, 0.55,  1.6), // rear left
      new THREE.Vector3(4, 0.55,  1.6)   // rear right
    ];
    padPositions.forEach((p, idx) => {
      const boltGroup = new THREE.Group();
      const boltHeight = 1.1;
      const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,boltHeight,16), darkHardware.clone());
      // Cylinder centered; raise so bottom sits slightly inside base
      shank.position.set(p.x, p.y + boltHeight/2 - 0.15, p.z);
      boltGroup.add(shank);
      // Head (hex) & washer (optional subtle ring)
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.18,6), steel.clone());
      head.position.set(p.x, p.y + boltHeight - 0.05, p.z);
      boltGroup.add(head);
      const washer = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.04,24), metal.clone());
      washer.position.set(p.x, p.y + 0.02, p.z);
      boltGroup.add(washer);
      // Small nut just below head to imply threading (visual cue)
      const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.14,6), darkHardware.clone());
      nut.position.set(p.x, p.y + boltHeight - 0.20, p.z);
      boltGroup.add(nut);
      // Slight stagger in Y for visual differentiation when exploded
      boltGroup.position.y += idx * 0.02;
      bolts.add(boltGroup);
    });
    addPart('fasteners', bolts, new THREE.Vector3(0,0,0), new THREE.Vector3(-5,0,4));

    partsRef.current = parts;

    // (Removed) Previously auto-assembled after delay; now we begin assembled with button offering to explode.

    // Raycasting selection
    const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
    function handlePointerDown(e:PointerEvent) {
      if (!onSelectRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left)/rect.width)*2 - 1; mouse.y = -((e.clientY - rect.top)/rect.height)*2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const objs: THREE.Object3D[] = []; partsRef.current.forEach(p => p.group.traverse(o => { if ((o as any).isMesh) objs.push(o); }));
      const hits = raycaster.intersectObjects(objs, false);
      if (hits.length) {
        const hit = hits[0].object;
  const found = partsRef.current.find(p => hit === p.group || p.group.children.includes(hit) || (hit as any).parent === p.group);
        if (found) onSelectRef.current(found.key);
      }
    }
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Animate loop
    const clock = new THREE.Clock();
    function animate() {
      const t = clock.getElapsedTime();
      // Pure visual rotation: spin only the internal impeller spin group to avoid coordinate drift
      if (impellerSpinRef.current) {
        // Continuous rotation; speed modulated slightly when exploded vs assembled for subtle cue
        const speed = isExploded ? 0.9 : 2.8;
        impellerSpinRef.current.rotation.x = t * speed;
      }
  const motor = partsRef.current.find(p => p.key === 'motor');
  if (motor) { motor.group.rotation.x = 0.02 * Math.sin(t*0.5); }
      controls.update();
      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      if (!containerRef.current) return; const nw = containerRef.current.clientWidth; const nh = containerRef.current.clientHeight; camera.aspect = nw/nh; camera.updateProjectionMatrix(); renderer.setSize(nw,nh);
    }
    window.addEventListener('resize', handleResize);
    if (onReadyRef.current) { try { onReadyRef.current({ capture: () => renderer.domElement.toDataURL('image/png') }); } catch { /* ignore */ } }

    return () => {
  if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      el.removeChild(renderer.domElement);
  scene.traverse(o => { if ((o as any).isMesh) { (o as any).geometry?.dispose(); const m = (o as any).material; if (Array.isArray(m)) m.forEach(mm=>mm.dispose?.()); else m?.dispose?.(); } });
  if (impellerTextureRef.current) { impellerTextureRef.current.dispose(); }
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Brightness live updates
  useEffect(() => {
    const r:any = rendererRef.current; if (r && r.toneMappingExposure !== undefined) r.toneMappingExposure = 1.1 * brightness;
    const { hemi, key } = lightRefs.current; if (hemi) (hemi as any).intensity = 0.7*brightness; if (key) (key as any).intensity = 1.25*brightness;
  }, [brightness]);

  return (
    <div className="three-dashboard" ref={containerRef} aria-label="Pump assembly exploded view">
      <div className="three-overlay-controls">
  <button type="button" onClick={toggleAssembly}>{isExploded ? 'Assemble' : 'Explode'}</button>
  <span className="assembly-hint">Toggle exploded / assembled view</span>
      </div>
    </div>
  );
}

export default AssemblyExplodedScene;