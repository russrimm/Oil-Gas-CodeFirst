/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// Oil & Gas production well pad visualization: pumpjack, wellheads, separator, storage tanks, manifold, gas line, flare.
interface ThreeDashboardProps { focus?: string | null; onSelect?: (key: string) => void; onReady?: (api: { capture: () => string }) => void; brightness?: number; flareRate?: number; recoveredVaporRate?: number }

// Educational knowledge base (paraphrased summaries for learning; not verbatim from sources)
// Each entry: concise role, core functions, key concepts, safety & monitoring focus, quick quiz.
interface KnowledgeEntry {
  title: string;
  role: string;
  coreFunctions: string[];
  keyConcepts: string[];
  safety: string[];
  monitoring: string[];
  quiz: { q: string; a: string }[];
}

const COMPONENT_KNOWLEDGE: Record<string, KnowledgeEntry> = {
  pumpjack: {
    title: 'Pumpjack (Beam Pumping Unit)',
    role: 'Lifts produced fluids from the wellbore to surface when reservoir pressure is insufficient for natural flow.',
    coreFunctions: [
      'Convert rotary motor motion to reciprocating lift',
      'Drive sucker rod string & downhole pump',
      'Provide counterbalance for efficient stroke energy',
    ],
    keyConcepts: [
      'Stroke length & strokes per minute (SPM)',
      'Pump fill efficiency / fluid pound avoidance',
      'Rod load & counterweight balance',
    ],
    safety: [
      'Guarding of rotating & pinch points',
      'Start/stop lockout procedures',
      'Structural inspection of beams & bolts',
    ],
    monitoring: [
      'Motor current & power draw trends',
      'Dynacard (surface load vs position)',
      'Production rate vs expected decline',
    ],
    quiz: [
      { q: 'What diagnostic plot helps identify pump fill issues?', a: 'Dynacard (surface load vs position).' },
    ],
  },
  separator: {
    title: 'Three-Phase Separator',
    role: 'Separates incoming multiphase production into oil, gas, and produced water streams for measurement & handling.',
    coreFunctions: [
      'Promote gravity segregation of phases',
      'Provide retention time & level control',
      'Enable pressure & flow conditioning',
    ],
    keyConcepts: [
      'Residence time vs throughput',
      'Interface (oil/water) level control strategy',
      'Mist extraction & demisting efficiency',
    ],
    safety: [
      'Overpressure protection (PSV / rupture disc)',
      'Level controller failure mitigation',
      'Gas blow-by / liquid carryover prevention',
    ],
    monitoring: [
      'Oil & water level trends',
      'Separator pressure & temperature',
      'Differential pressure across internals',
    ],
    quiz: [
      { q: 'What phase typically exits the top of a separator?', a: 'Gas.' },
    ],
  },
  tanks: {
    title: 'Storage Tanks (Oil & Produced Water)',
    role: 'Provide buffered storage & load-leveling before transport or further treatment.',
    coreFunctions: [
      'Temporary inventory for stabilized crude',
      'Allow water settling & basic conditioning',
      'Vapor balancing / emission control (VRU or flare)',
    ],
    keyConcepts: [
      'Fixed vs floating roof (vapor losses)',
      'Vapor pressure, working & breathing losses',
      'Secondary containment (dike / berm)',
    ],
    safety: [
      'Overfill prevention & high-level alarms',
      'Fire/explosion risk (static, vapors)',
      'Tank integrity: corrosion, bottom leakage',
    ],
    monitoring: [
      'Level trends & turnover rate',
      'Emissions capture efficiency',
      'BS&W (basic sediment & water) percentage',
    ],
    quiz: [
      { q: 'What design reduces evaporative loss in volatile products?', a: 'Floating roof.' },
    ],
  },
  manifold: {
    title: 'Production Manifold',
    role: 'Central hub routing flow from multiple wells to test or production lines; enables isolation & allocation.',
    coreFunctions: [
      'Combine / segregate multiphase streams',
      'Direct individual wells to test separator',
      'Provide isolation & pressure equalization',
    ],
    keyConcepts: [
      'Valve lineup management (test vs production path)',
      'Pressure balancing & erosion at junctions',
      'Expandable headers (future wells)',
    ],
    safety: [
      'Proper pressure rating & leak integrity',
      'Erosion / sand monitoring near tees',
      'Clear labeling to avoid misrouting',
    ],
    monitoring: [
      'Individual well rates (periodic test)',
      'Header pressure & temperature',
      'Valve position verification',
    ],
    quiz: [
      { q: 'Why periodically route a single well to a test separator?', a: 'To measure its individual production for allocation.' },
    ],
  },
  pipelines: {
    title: 'Pad Flowlines / Pipelines',
    role: 'Transport multiphase or single-phase fluids from wellheads & equipment to processing.',
    coreFunctions: [
      'Move fluids with minimal pressure drop',
      'Segregate service (oil, gas, water)',
      'Provide access for pigging / chemical injection',
    ],
    keyConcepts: [
      'Flow regime & hydrate / wax risk',
      'Corrosion allowance & inhibition',
      'Difference: short in-field flowline vs long transmission pipeline',
    ],
    safety: [
      'Leak detection & pressure monitoring',
      'Right-of-way integrity / mechanical damage prevention',
      'Overpressure protection at sources',
    ],
    monitoring: [
      'Line pressure gradient',
      'Temperature (flow assurance)',
      'Corrosion coupon / probe data',
    ],
    quiz: [
      { q: 'Name one reason to inject chemicals into a flowline.', a: 'Corrosion inhibition or hydrate prevention.' },
    ],
  },
  wellheads: {
    title: 'Wellheads & Trees',
    role: 'Mechanical & pressure-containing interface between subsurface completion and surface facilities; controls flow and provides access for intervention.',
    coreFunctions: [
      'Support casing & tubing hangers',
      'Provide primary pressure barriers',
      'Flow control & isolation via master/wing/swab valves',
    ],
    keyConcepts: [
      'Difference between wellhead (structural/pressure base) & Christmas tree (valve assembly)',
      'Injection vs production configurations',
      'Fail-safe valve actuation & two-barrier philosophy',
    ],
    safety: [
      'Pressure integrity testing (SIT / leak-off)',
      'Valve maintenance & actuator reliability',
      'Emergency shutdown (ESD) readiness',
    ],
    monitoring: [
      'Annulus pressure trends',
      'Valve position & actuation pressure',
      'Temperature / sand / corrosion sensors',
    ],
    quiz: [
      { q: 'What is the right-hand lateral valve on a surface tree commonly called?', a: 'Production (flow) wing valve.' },
    ],
  },
  flare: {
    title: 'Flare Stack / Flare System',
    role: 'Safely combust waste or relief gases to prevent overpressure & reduce direct hydrocarbon release.',
    coreFunctions: [
      'Relief / emergency pressure protection',
      'Controlled combustion of excess gases',
      'Pilot & ignition readiness',
    ],
    keyConcepts: [
      'Knockout drum removes liquids before flare',
      'Steam/air assist for smokeless operation',
      'Purge gas prevents air ingress & flashback',
    ],
    safety: [
      'Maintain pilot reliability',
      'Prevent liquid carryover (seal drum level)',
      'Monitor radiant heat & safe distances',
    ],
    monitoring: [
      'Pilot flame detection',
      'Relief event flow rates & composition',
      'Emission intensity / smokiness',
    ],
    quiz: [
      { q: 'Why is purge gas maintained in a flare header?', a: 'To prevent air backflow & potential flashback.' },
    ],
  },
  vru: {
    title: 'Vapor Recovery Unit (VRU)',
    role: 'Captures low-pressure hydrocarbon vapors (tank / flash gas) and compresses them for sales or fuel, reducing emissions and product loss.',
    coreFunctions: [
      'Collect working / breathing & flash vapors from tanks',
      'Compress vapors to sales line or fuel system',
      'Stabilize tank pressure below vent / flare threshold',
    ],
    keyConcepts: [
      'Flash gas vs working & breathing losses',
      'Setpoint control to prevent oxygen ingress',
      'Recovered volume improves overall yield',
    ],
    safety: [
      'Classified area electrical compliance',
      'Overpressure protection on suction & discharge',
      'Monitor vibration / temperature on compressor',
    ],
    monitoring: [
      'Recovered vapor flow (Mscf/d or scfm)',
      'Suction pressure stability vs setpoint',
      'Compressor load & run status',
    ],
    quiz: [
      { q: 'What is one economic benefit of a VRU?', a: 'Recovered vapors are sold as gas instead of being flared or vented.' },
    ],
  },
  kodrum: {
    title: 'Flare Knockout Drum (KO Drum)',
    role: 'Separates and removes entrained liquids or slugs from relief / vent gas before it reaches the flare stack.',
    coreFunctions: [
      'Provide disengagement volume for liquid drops',
      'Protect flare from liquid carryover & fallout',
      'Act as a seal to limit air ingress (in seal drum configs)',
    ],
    keyConcepts: [
      'Retention time vs expected slug volume',
      'Liquid seal height (if seal drum type)',
      'Drain management & condensate recovery',
    ],
    safety: [
      'Level monitoring to prevent overflow to flare',
      'Relief sizing to avoid overpressure',
      'Proper draining & disposal of collected liquids',
    ],
    monitoring: [
      'Liquid level / high-level alarm',
      'Temperature (wax / hydrate risk in cold climates)',
      'Differential pressure (plugging indication)',
    ],
    quiz: [
      { q: 'Why is liquid removal before the flare important?', a: 'Liquids can create large smoky flames and potential fallout hazards.' },
    ],
  },
};

export function ThreeDashboard({ focus = null, onSelect, onReady, brightness = 1.0, flareRate = 0, recoveredVaporRate = 0 }: ThreeDashboardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const infoCardRef = useRef<HTMLDivElement | null>(null);
  // Refs for brightness dynamic adjustments
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const lightRefs = useRef<{ hemi?: THREE.HemisphereLight; key?: THREE.DirectionalLight; rim?: THREE.DirectionalLight; fill?: THREE.PointLight }>({});
  const controlsRef = useRef<any>(null);
  const composerRef = useRef<any>(null);
  const outlinePassRef = useRef<any>(null);
  // Flare rate ref for gas puff emission logic
  const flareRateRef = useRef<number>(flareRate);
  const recoveredVaporRateRef = useRef<number>(recoveredVaporRate);

  const highlightablesRef = useRef<{ key: string; objects: THREE.Object3D[] }[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

  const width = el.clientWidth;
  const height = el.clientHeight;

  // Realism advanced visuals toggle (initially on). Runtime button adjusts only dynamic effects; full reload applies full pipeline.
  let realismEnabled = true;

    const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a141e');
  scene.fog = new THREE.FogExp2('#0a141e', 0.06);

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 160);
  camera.position.set(4.6, 2.7, 5.2);
    camera.lookAt(0, 0.6, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (realismEnabled) {
      (renderer as any).toneMapping = (THREE as any).ACESFilmicToneMapping;
  (renderer as any).toneMappingExposure = 1.15 * brightness;
      (renderer as any).shadowMap = (renderer as any).shadowMap || {};
      try {
        (renderer as any).shadowMap.enabled = true;
        (renderer as any).shadowMap.type = (THREE as any).PCFSoftShadowMap;
      } catch { /* ignore if shim lacks shadowMap */ }
    }
    rendererRef.current = renderer;
  // (Shadow map disabled intentionally; keeping defaults)
    el.appendChild(renderer.domElement);

    // Orbit controls for interactive exploration
  const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.085;
    controls.minDistance = 3;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.58;
    controls.target.set(0,0.6,0);
    controls.update();
    controlsRef.current = controls;
    // Post-processing composer + outline
    try {
      const composer = new EffectComposer(renderer as any);
      composer.addPass(new RenderPass(scene, camera));
      const outline: any = new OutlinePass(new (THREE as any).Vector2(width, height), scene, camera);
      outline.edgeStrength = 2.0;
      outline.edgeGlow = 0.25;
      outline.edgeThickness = 1.0;
      outline.pulsePeriod = 3;
      outline.visibleEdgeColor.set('#1d86d5');
      outline.hiddenEdgeColor.set('#0a2a3c');
      composer.addPass(outline);
      composerRef.current = composer;
      outlinePassRef.current = outline;
    } catch { /* Outline optional */ }

    // Lights
  const hemi = new THREE.HemisphereLight(0x9bc9ff, 0x1a1f25, 0.7 * brightness);
    scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffdfbb, 1.25 * brightness);
  key.position.set(6, 9, 4.5);
    if (realismEnabled) {
      (key as any).castShadow = true;
      try {
        (key as any).shadow.mapSize.set(1024,1024);
        (key as any).shadow.camera.near = 1;
        (key as any).shadow.camera.far = 30;
        (key as any).shadow.camera.left = -10; (key as any).shadow.camera.right = 10; (key as any).shadow.camera.top = 10; (key as any).shadow.camera.bottom = -10;
      } catch { /* shadow api may be absent in shim */ }
    }
    scene.add(key);
  const rim = new THREE.DirectionalLight(0x335577, 0.55 * brightness);
  rim.position.set(-6, 5, -5);
  rim.castShadow = false;
  scene.add(rim);
  const fill = new THREE.PointLight(0xff6a1b, 1.35 * brightness, 28, 2.0); // flare color
  fill.position.set(-2.2, 3.4, 1.4);
  scene.add(fill);
    lightRefs.current = { hemi, key, rim, fill };
  const baseFillIntensity = (fill as any).intensity; // store base intensity for flicker modulation

    // Ground pad
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1b252c, roughness: 0.95, metalness: 0.05 });
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.12, 64), groundMat);
    ground.position.y = -0.06;
  if (realismEnabled) (ground as any).receiveShadow = true;
    scene.add(ground);

    // Storage tanks cluster (two crude + one produced water) – upgraded realism
    const tanksGroup = new THREE.Group();
    interface TankSpec { x:number; z:number; height:number; r:number; color:number; type:'crude'|'water'; }
    const tankSpecs: TankSpec[] = [
      { x:-5.0, z:-2.2, height:1.18, r:0.6, color:0x4d6b7a, type:'crude' },
      { x:-6.2, z:-1.4, height:1.18, r:0.6, color:0x597884, type:'crude' },
      { x:-5.6, z:-3.4, height:1.02, r:0.5, color:0x31454f, type:'water' }
    ];
    const tankGroups: THREE.Group[] = [];
    function buildTank(spec: TankSpec) {
      const g = new THREE.Group();
      g.position.set(spec.x,0,spec.z);
      const shellMat = new THREE.MeshStandardMaterial({ color:spec.color, metalness:0.55, roughness:0.36, emissive:0x0d1012, emissiveIntensity:0.18 });
      // Main shell with subtle horizontal seam rings
  // Shell (closed) – omit openEnded flag for simplified type defs
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(spec.r,spec.r,spec.height,40,1), shellMat);
      shell.position.y = spec.height/2;
      g.add(shell);
      for (let i=1;i<4;i++) { // seam rings
  const ring = new THREE.Mesh(new (THREE as any).TorusGeometry(spec.r*0.995, spec.r*0.015, 8, 40), new THREE.MeshStandardMaterial({ color:spec.color, metalness:0.5, roughness:0.4 }));
        ring.rotation.x = Math.PI/2;
        ring.position.y = (spec.height/4)*i;
        g.add(ring);
      }
  // Slightly domed roof approximation using a tapered short cylinder
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(spec.r*0.96, spec.r*0.99, 0.16, 36, 1), new THREE.MeshStandardMaterial({ color:0x2a3137, metalness:0.25, roughness:0.8 }));
  roof.position.y = spec.height + 0.08;
      g.add(roof);
      // Top perimeter handrail
      const railMatTank = new THREE.MeshStandardMaterial({ color:0xb7c4cb, metalness:0.55, roughness:0.4 });
  const topRail = new THREE.Mesh(new (THREE as any).TorusGeometry(spec.r*0.9, 0.01, 8, 48), railMatTank);
      topRail.rotation.x = Math.PI/2; topRail.position.y = spec.height + 0.18; g.add(topRail);
      // Vertical posts for handrail
      for (let a=0; a<Math.PI*2; a+=Math.PI/6) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,0.20,6), railMatTank);
        post.position.set(Math.cos(a)*spec.r*0.9, spec.height+0.10, Math.sin(a)*spec.r*0.9);
        g.add(post);
      }
      // Side manway (lower shell)
      const manway = new THREE.Mesh(new THREE.CylinderGeometry(spec.r*0.22,spec.r*0.22,0.05,24), new THREE.MeshStandardMaterial({ color:0x6d7a82, metalness:0.5, roughness:0.55, emissive:0x101416, emissiveIntensity:0.15 }));
      manway.rotation.x = Math.PI/2; manway.position.set(spec.r*0.99, spec.height*0.35, 0);
      g.add(manway);
      // Thief hatch + vent (roof center + offset)
      const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.09,16), new THREE.MeshStandardMaterial({ color:0x556066, metalness:0.45, roughness:0.5 }));
      hatch.position.y = spec.height + 0.12; g.add(hatch);
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.24,16), new THREE.MeshStandardMaterial({ color:0x7a858c, metalness:0.5, roughness:0.45 }));
      vent.position.set(spec.r*0.35, spec.height + 0.22, spec.r*0.25); g.add(vent);
      // External ladder with cage (single access point oriented toward VRU side (-X))
      // Original implementation placed both rails nearly co-linear causing distorted rungs; corrected here.
      const ladder = new THREE.Group();
      const ladderHeight = spec.height + 0.18;
      const ladderRailMat = new THREE.MeshStandardMaterial({ color:0xc9d2d7, metalness:0.55, roughness:0.35 });
      const railSeparation = 0.36; // distance between rails (center to center) along Z
      const railA = new THREE.Mesh(new THREE.BoxGeometry(0.03, ladderHeight, 0.03), ladderRailMat);
      const railB = new THREE.Mesh(new THREE.BoxGeometry(0.03, ladderHeight, 0.03), ladderRailMat.clone());
      railA.position.set(-spec.r*0.99, ladderHeight/2, -railSeparation/2);
      railB.position.set(-spec.r*0.99, ladderHeight/2,  railSeparation/2);
      ladder.add(railA, railB);
      // Rungs now span between rails (extend along Z)
      const rungCount =  nineRungs();
      function nineRungs(){ return 9; } // small helper to keep numeric literal isolated for potential tuning
      const rungSpan = ladderHeight/(rungCount+1);
      for (let i=0;i<rungCount;i++) {
        const y = (i+1)*rungSpan;
        const rung = new THREE.Mesh(new THREE.BoxGeometry(0.04,0.02, railSeparation + 0.04), ladderRailMat.clone());
        rung.position.set(-spec.r*0.99, y, 0);
        ladder.add(rung);
      }
      // (Cage hoops removed per user request – ladder remains open) 
      g.add(ladder);
      // Level gauge (sight glass) – crude: amber, water: blue-green
      const gaugeMat = new THREE.MeshStandardMaterial({ color:0x1b2d33, metalness:0.2, roughness:0.7, emissive: spec.type==='water'?0x0a6ea0:0x8a4108, emissiveIntensity:0.7 });
      const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,spec.height*0.72,12), gaugeMat);
      gauge.position.set(-spec.r*0.65, spec.height*0.50, spec.r*0.88);
      g.add(gauge);
      const levelFrac = spec.type==='water'? 0.55 : 0.62; // static representative fill
      const fluidColor = spec.type==='water'? 0x1c8fb8 : 0x8c5d24;
      const fluid = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,spec.height*0.72*levelFrac,12), new THREE.MeshStandardMaterial({ color:fluidColor, metalness:0.1, roughness:0.3, emissive:fluidColor, emissiveIntensity:0.6, transparent:true, opacity:0.85 }));
      fluid.position.set(gauge.position.x, gauge.position.y - (spec.height*0.72*(1-levelFrac)/2), gauge.position.z);
      g.add(fluid);
  // Internal bulk fluid volume (not visible above roof) – dynamic level mesh inside tank shell.
  const bulkMat = new THREE.MeshStandardMaterial({ color: fluidColor, metalness:0.05, roughness:0.25, transparent:true, opacity:0.82, emissive: fluidColor, emissiveIntensity:0.12 });
  const bulk = new THREE.Mesh(new THREE.CylinderGeometry(spec.r*0.96, spec.r*0.96, 0.02, 32), bulkMat);
  bulk.position.y = 0.01; // will be raised via scaling
  bulk.scale.y = levelFrac * (spec.height-0.18); // initial height approximation
  // Store references for animation updates
  (g as any).userData.fluidLevel = levelFrac; // target fraction 0..1
  (g as any).userData.bulkFluid = bulk;
  g.add(bulk);
      // Bottom outlet nozzle stub
      const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.32,18), new THREE.MeshStandardMaterial({ color:0x9aa8b1, metalness:0.55, roughness:0.4 }));
      outlet.rotation.x = Math.PI/2; outlet.position.set(spec.r*0.4, 0.18, spec.r+0.16);
      g.add(outlet);
      tanksGroup.add(g);
      tankGroups.push(g);
      return g;
    }
    tankSpecs.forEach(buildTank);
    // Catwalk between the two crude tanks (first two specs) with handrails
    const crudeA = tankGroups[0]; const crudeB = tankGroups[1];
    if (crudeA && crudeB) {
      const catwalkY = tankSpecs[0].height + 0.12;
      const spanVec = new THREE.Vector3(
        crudeB.position.x - crudeA.position.x,
        crudeB.position.y - crudeA.position.y,
        crudeB.position.z - crudeA.position.z
      );
      const mid = new THREE.Vector3().addVectors(crudeA.position, crudeB.position).multiplyScalar(0.5);
  const spanLen = Math.sqrt(spanVec.x*spanVec.x + spanVec.y*spanVec.y + spanVec.z*spanVec.z);
  const catLen = spanLen - tankSpecs[0].r*1.4; // shorten so it doesn't overlap rails
      const cat = new THREE.Mesh(new THREE.BoxGeometry(catLen,0.05,0.6), new THREE.MeshStandardMaterial({ color:0x3a4750, metalness:0.25, roughness:0.75 }));
      cat.position.set(mid.x, catwalkY, mid.z);
      // Orient along vector between tanks
      cat.rotation.y = Math.atan2(spanVec.z, spanVec.x);
      tanksGroup.add(cat);
      // Handrails (simple)
      const railMat = new THREE.MeshStandardMaterial({ color:0xbac8cf, metalness:0.6, roughness:0.3 });
      const railHeight = 0.42;
  for (const side of [-0.28,0.28]) {
        const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,catLen*0.92,12), railMat);
        topBar.rotation.y = cat.rotation.y; topBar.position.set(mid.x, catwalkY+railHeight-0.02, mid.z + side*Math.cos(cat.rotation.y));
        tanksGroup.add(topBar);
        // posts
        const postCount = 4;
        for (let i=0;i<=postCount;i++) {
          const t = (i/postCount) - 0.5;
          const px = mid.x + t*catLen*Math.cos(cat.rotation.y);
          const pz = mid.z + t*catLen*Math.sin(cat.rotation.y) + side*Math.cos(cat.rotation.y);
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.013,0.013,railHeight,8), railMat.clone());
          post.position.set(px, catwalkY+railHeight/2, pz);
          tanksGroup.add(post);
        }
      }
      // Simple stair from ground to catwalk (one side facing +Z)
      const stair = new THREE.Group();
      const steps = 6; const stairWidth = 0.55; const rise = railHeight/steps; const run = 0.16;
      for (let i=0;i<steps;i++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(stairWidth,0.03,run), new THREE.MeshStandardMaterial({ color:0x2c3841, metalness:0.25, roughness:0.8 }));
        step.position.set(mid.x + (catLen*0.5 - 0.2)*Math.cos(cat.rotation.y), 0.05 + rise*(i+0.5), mid.z + (catLen*0.5 - 0.2)*Math.sin(cat.rotation.y) + 0.15 + i*0.06);
  // placeholder for potential future interaction logic
        stair.add(step);
      }
  // removed unused stairsafe helper (no-op)
      tanksGroup.add(stair);
    }
    // Vapor header (simple piping) from crude tank roofs toward VRU scrubber area
    try {
      const headerMat = new THREE.MeshStandardMaterial({ color:0x8d99a1, metalness:0.55, roughness:0.42 });
      const roofY = tankSpecs[0].height + 0.18;
      const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.55,16), headerMat); riser.position.set(tankSpecs[0].x, roofY-0.275, tankSpecs[0].z); tanksGroup.add(riser);
      const horiz = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.1,16), headerMat.clone()); horiz.rotation.z = Math.PI/2; horiz.position.set(tankSpecs[0].x-0.55, roofY, tankSpecs[0].z); tanksGroup.add(horiz);
      const runToVRU = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.4,20), headerMat.clone()); runToVRU.rotation.x = Math.PI/2; runToVRU.position.set(tankSpecs[0].x-0.70, roofY-0.05, tankSpecs[0].z-0.70); tanksGroup.add(runToVRU);
    } catch { /* piping optional */ }
    if (realismEnabled) tanksGroup.traverse(o=> { if ((o as any).isMesh){ (o as any).castShadow = true; (o as any).receiveShadow = true; }});
    scene.add(tanksGroup);

  // Vapor Recovery Unit (VRU) – enhanced skid with receiver, scrubber, compressor, aftercooler & piping
  const vruGroup = new THREE.Group();
  // Skid base frame
  const skidFrameMat = new THREE.MeshStandardMaterial({ color:0x233037, roughness:0.85, metalness:0.18 });
  const vruPad = new THREE.Mesh(new THREE.BoxGeometry(1.9,0.08,0.9), skidFrameMat);
  vruPad.position.set(-7.25,0.04,-0.55);
  vruGroup.add(vruPad);
  // Grating surface
  const gratingTop = new THREE.Mesh(new THREE.BoxGeometry(1.82,0.015,0.82), new THREE.MeshStandardMaterial({ color:0x2d3a41, metalness:0.25, roughness:0.75, emissive:0x0d1418, emissiveIntensity:0.15 }));
  gratingTop.position.copy(vruPad.position).add(new THREE.Vector3(0,0.055,0));
  vruGroup.add(gratingTop);
  // Horizontal receiver (flash vapors accumulator) with elliptical heads & saddles
  const recvRadius = 0.23; const recvLen = 1.15;
  const recvMat = new THREE.MeshStandardMaterial({ color:0x70848f, metalness:0.6, roughness:0.38, emissive:0x0e1418, emissiveIntensity:0.22 });
  const vruVesselShell = new THREE.Mesh(new THREE.CylinderGeometry(recvRadius,recvRadius,recvLen,36,1), recvMat);
  vruVesselShell.rotation.z = Math.PI/2;
  vruVesselShell.position.set(-7.25,0.40,-0.62);
  vruGroup.add(vruVesselShell);
  const vruHeadGeo = new THREE.SphereGeometry(recvRadius,32,20);
  const headL = new THREE.Mesh(vruHeadGeo, recvMat.clone()); headL.scale.set(0.75,1,1); headL.position.set(vruVesselShell.position.x - recvLen/2, vruVesselShell.position.y, vruVesselShell.position.z); vruGroup.add(headL);
  const headR = new THREE.Mesh(vruHeadGeo, recvMat.clone()); headR.scale.set(0.75,1,1); headR.position.set(vruVesselShell.position.x + recvLen/2, vruVesselShell.position.y, vruVesselShell.position.z); vruGroup.add(headR);
  // Saddles
  const saddleMatVRU = new THREE.MeshStandardMaterial({ color:0x2c363c, metalness:0.3, roughness:0.8 });
  function makeVesselSaddle(offset:number){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.34,0.08,0.42), saddleMatVRU); base.position.set(0,0.04,0); g.add(base);
    const web = new THREE.Mesh(new THREE.BoxGeometry(0.30,0.26,0.26), new THREE.MeshStandardMaterial({ color:0x374349, metalness:0.25, roughness:0.85 })); web.position.set(0,0.21,0); g.add(web);
    g.position.set(vruVesselShell.position.x + offset,0,vruVesselShell.position.z);
    return g;
  }
  vruGroup.add(makeVesselSaddle(-0.35), makeVesselSaddle(0.35));
  // Suction scrubber (vertical small knock-out pot) in front of receiver
  const scrubberMat = new THREE.MeshStandardMaterial({ color:0x6d7d86, metalness:0.55, roughness:0.45, emissive:0x10181c, emissiveIntensity:0.18 });
  const scrubber = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.55,28,1), scrubberMat);
  scrubber.position.set(-7.55,0.55,-0.25);
  vruGroup.add(scrubber);
  const scrubHead = new THREE.Mesh(new THREE.SphereGeometry(0.16,28,18), scrubberMat.clone()); scrubHead.scale.set(1,0.55,1); scrubHead.position.set(scrubber.position.x, scrubber.position.y+0.55/2, scrubber.position.z); vruGroup.add(scrubHead);
  // Compressor block + motor (reuse vruComp name for animation)
  const vruComp = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.30,0.50), new THREE.MeshStandardMaterial({ color:0x55636c, metalness:0.55, roughness:0.42, emissive:0x142126, emissiveIntensity:0.42 }));
  vruComp.position.set(-6.85,0.22,-0.25);
  vruGroup.add(vruComp);
  // Motor housing
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.42,24), new THREE.MeshStandardMaterial({ color:0x647783, metalness:0.55, roughness:0.35, emissive:0x0e171d, emissiveIntensity:0.28 }));
  motor.rotation.z = Math.PI/2; motor.position.set(-6.55,0.27,-0.25); vruGroup.add(motor);
  // Blower / primary fan (reuse fanDisc for rotation)
  const fanDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.05,26), new THREE.MeshStandardMaterial({ color:0x8b98a2, metalness:0.6, roughness:0.35 }));
  fanDisc.rotation.x = Math.PI/2; fanDisc.position.set(-6.55,0.27,-0.25); vruGroup.add(fanDisc);
  // Discharge aftercooler – finned box w/ axial fan on top
  const coolerFrame = new THREE.Mesh(new THREE.BoxGeometry(0.72,0.12,0.6), new THREE.MeshStandardMaterial({ color:0x38454d, metalness:0.35, roughness:0.75 }));
  coolerFrame.position.set(-6.9,0.50,0.00); vruGroup.add(coolerFrame);
  const finMat = new THREE.MeshStandardMaterial({ color:0x9aa6ac, metalness:0.55, roughness:0.4 });
  for (let i=0;i<5;i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.66,0.01,0.08), finMat);
    fin.position.set(coolerFrame.position.x, coolerFrame.position.y+0.02, coolerFrame.position.z - 0.24 + i*0.12);
    vruGroup.add(fin);
  }
  let coolerFan: THREE.Mesh | null = null;
  coolerFan = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.04,24), new THREE.MeshStandardMaterial({ color:0xced6da, metalness:0.55, roughness:0.3 }));
  coolerFan.rotation.x = Math.PI/2; coolerFan.position.set(coolerFrame.position.x, coolerFrame.position.y+0.10, coolerFrame.position.z); vruGroup.add(coolerFan);
  // Control panel with indicator lights
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.34,0.10), new THREE.MeshStandardMaterial({ color:0x2f3d45, metalness:0.25, roughness:0.6, emissive:0x121d22, emissiveIntensity:0.25 }));
  panel.position.set(-7.55,0.27,0.20); vruGroup.add(panel);
  const panelLightMat = new THREE.MeshStandardMaterial({ color:0x1d272c, metalness:0.2, roughness:0.5, emissive:0x003b55, emissiveIntensity:0.8 });
  const panelLights: THREE.Mesh[] = [];
  for (let i=0;i<3;i++) {
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.02,14), panelLightMat.clone());
    pl.rotation.x = Math.PI/2; pl.position.set(panel.position.x, panel.position.y + 0.10 - i*0.10, panel.position.z + 0.055); panelLights.push(pl); vruGroup.add(pl);
  }
  // Simple pressure gauge on suction line
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.02,24), new THREE.MeshStandardMaterial({ color:0xe1e7ec, metalness:0.25, roughness:0.55, emissive:0x111111, emissiveIntensity:0.35 }));
  gauge.rotation.x = Math.PI/2; gauge.position.set(scrubber.position.x - 0.0, scrubber.position.y + 0.18, scrubber.position.z + 0.12); vruGroup.add(gauge);
  // Suction piping: from receiver (bottom) to compressor inlet & from scrubber to receiver
  const pipeMatVRU = new THREE.MeshStandardMaterial({ color:0x8d99a1, metalness:0.55, roughness:0.42, emissive:0x0f1417, emissiveIntensity:0.20 });
  function horizPipe(len:number, r=0.06) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,18), pipeMatVRU.clone()); m.rotation.z = Math.PI/2; return m; }
  function vertPipe(len:number, r=0.06) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,18), pipeMatVRU.clone()); return m; }
  const scrubToRecv = horizPipe(0.55,0.05); scrubToRecv.position.set(-7.38,0.50,-0.44); vruGroup.add(scrubToRecv);
  const recvToComp = horizPipe(0.55,0.07); recvToComp.position.set(-6.95,0.40,-0.60); vruGroup.add(recvToComp);
  const dropIntoComp = vertPipe(0.25,0.07); dropIntoComp.position.set(-6.68,0.40-0.125,-0.60); vruGroup.add(dropIntoComp);
  // Discharge piping up & over to aftercooler then out (stub toward separator direction)
  const compDisch = horizPipe(0.36,0.07); compDisch.position.set(-6.65,0.34,-0.25); vruGroup.add(compDisch);
  const dischRise = vertPipe(0.40,0.07); dischRise.position.set(-6.47,0.34+0.20,-0.25); vruGroup.add(dischRise);
  const dischOver = horizPipe(0.55,0.07); dischOver.position.set(-6.47+0.275,0.54,-0.10); dischOver.rotation.x = 0; vruGroup.add(dischOver);
  const overBend = vertPipe(0.18,0.07); overBend.position.set(-6.20,0.54-0.09,-0.10); vruGroup.add(overBend);
  const toCooler = horizPipe(0.42,0.07); toCooler.position.set(-6.20+0.21,0.45,0.00); vruGroup.add(toCooler);
  const coolerOutlet = horizPipe(0.55,0.07); coolerOutlet.position.set(-6.90+0.275,0.50,0.30); vruGroup.add(coolerOutlet);
  // Valve wheels (simplified) on suction & discharge
  const wheelMatVRU = new THREE.MeshStandardMaterial({ color:0xd5dfe4, metalness:0.6, roughness:0.35, emissive:0x0f1417, emissiveIntensity:0.35 });
  function makeWheelSimple(r=0.09) { const g = new THREE.Group(); const rim = new THREE.Mesh(new (THREE as any).TorusGeometry(r, r*0.18, 8, 24), wheelMatVRU); rim.rotation.x = Math.PI/2; g.add(rim); for (let i=0;i<4;i++){ const spoke = new THREE.Mesh(new THREE.BoxGeometry(r*0.12,r*0.12,r*1.4), wheelMatVRU); spoke.rotation.x = Math.PI/2; spoke.rotation.y = i*Math.PI/2; g.add(spoke);} return g; }
  const suctionValve = makeWheelSimple(0.075); suctionValve.position.set(scrubber.position.x - 0.18, 0.50, -0.38); vruGroup.add(suctionValve);
  const dischargeValve = makeWheelSimple(0.075); dischargeValve.position.set(-6.47,0.34+0.32,-0.25); vruGroup.add(dischargeValve);
  // Vent / small stack from receiver (retain previous idea)
  const ventPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.70,18), new THREE.MeshStandardMaterial({ color:0x657680, metalness:0.55, roughness:0.5 }));
  ventPipe.position.set(-7.55,0.78,-0.62); vruGroup.add(ventPipe);
  // Store refs for animation on group
  (vruGroup as any).userData.coolerFan = coolerFan;
  (vruGroup as any).userData.panelLights = panelLights;
  if (realismEnabled) vruGroup.traverse(o=> { if ((o as any).isMesh){ (o as any).castShadow = true; (o as any).receiveShadow = true; }});
  scene.add(vruGroup);

    // Pumpjack (enhanced realism)
    const pumpjackGroup = new THREE.Group();
    // Base beams (skid)
    const baseBeamMat = new THREE.MeshStandardMaterial({ color:0x27343b, metalness:0.45, roughness:0.65 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.12,0.7), baseBeamMat); // retain variable name 'base' for disposal
    base.position.y = 0.06; pumpjackGroup.add(base);
    // Samson post (A-frame) + braces
    const frameMat = new THREE.MeshStandardMaterial({ color:0x6d7d88, metalness:0.55, roughness:0.42 });
    function makeSupport(x:number,z:number){ const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16,1.3,0.16), frameMat); leg.position.set(x,0.65,z); return leg; }
    const legA = makeSupport(-0.5,-0.25); const legB = makeSupport(0.5,-0.25); const legC = makeSupport(-0.5,0.25); const legD = makeSupport(0.5,0.25);
    pumpjackGroup.add(legA,legB,legC,legD);
    const crossTop = new THREE.Mesh(new THREE.BoxGeometry(1.25,0.14,0.42), frameMat); crossTop.position.set(0,1.36,0); pumpjackGroup.add(crossTop);
    // Walking beam pivot group (for rotation)
    const beamPivot = new THREE.Group(); beamPivot.position.set(0,1.50,0); pumpjackGroup.add(beamPivot);
    // Walking beam (tapered approximation)
    const beamMat = new THREE.MeshStandardMaterial({ color:0x9aa8b5, metalness:0.58, roughness:0.30, emissive:0x0d1114, emissiveIntensity:0.25 });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.8,0.18,0.28), beamMat); // keep name 'beam'
    beam.position.set(0,0,0); beamPivot.add(beam);
    // Equalizer (connection region at rear end)
    const equalizer = new THREE.Mesh(new THREE.BoxGeometry(0.30,0.14,0.30), beamMat.clone()); equalizer.position.set(-0.75,0,0); beamPivot.add(equalizer);
    // Curved horsehead approximation with segmented arc plates
    const horseHeadGroup = new THREE.Group();
    for (let i=0;i<5;i++) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.20,0.20 - i*0.02,0.32), new THREE.MeshStandardMaterial({ color:0xb8c8d2, metalness:0.6, roughness:0.34 }));
      const t = i/4; // 0..1
      seg.position.set(0.9 + t*0.25, -0.05 + Math.sin(t*Math.PI*0.65)*0.18, 0);
      horseHeadGroup.add(seg);
    }
    horseHeadGroup.position.set(0,0,0);
    beamPivot.add(horseHeadGroup);
    // Retain horseHead variable (alias main group for highlight/disposal expectations)
    const horseHead = horseHeadGroup;
    // Polished rod + clamp + stuffing box
    const rodMat = new THREE.MeshStandardMaterial({ color:0xffc15a, metalness:0.55, roughness:0.38, emissive:0x6a3b00, emissiveIntensity:0.55 });
    const polishRod = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,1.25,24), rodMat);
    polishRod.position.set(1.08, -0.45, 0); // relative inside beam pivot; will update each frame
    beamPivot.add(polishRod);
    const rodClamp = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.10,0.18), new THREE.MeshStandardMaterial({ color:0x6b5a3a, metalness:0.4, roughness:0.5 }));
    rodClamp.position.set(1.08,-0.05,0); beamPivot.add(rodClamp);
    const stuffingBox = new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.11,0.28,20), new THREE.MeshStandardMaterial({ color:0x3d4a53, metalness:0.5, roughness:0.4 }));
    stuffingBox.rotation.x = Math.PI/2; stuffingBox.position.set(1.08,-0.98,0); pumpjackGroup.add(stuffingBox);
    // Crank wheel + counterweights + crank pin
    const crankGroup = new THREE.Group();
    crankGroup.position.set(-0.95,0.55,0);
    const crankWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,0.10,40), new THREE.MeshStandardMaterial({ color:0x3b4a53, metalness:0.58, roughness:0.42 }));
    crankWheel.rotation.x = Math.PI/2; crankGroup.add(crankWheel);
    const counterWeight = new THREE.Mesh(new THREE.BoxGeometry(0.26,0.18,0.34), new THREE.MeshStandardMaterial({ color:0x475862, metalness:0.5, roughness:0.38, emissive:0x111111, emissiveIntensity:0.28 }));
    counterWeight.position.set(0,0.20,0); crankGroup.add(counterWeight);
    // Crank pin (eccentric) where pitman arms attach
    const crankPin = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.34,16), new THREE.MeshStandardMaterial({ color:0xd8dde0, metalness:0.6, roughness:0.35 }));
    crankPin.rotation.x = Math.PI/2; crankPin.position.set(0.0,0.0,0); // will be offset via subgroup
    const pinOffset = 0.28; // eccentric radius
    const pinCarrier = new THREE.Group(); pinCarrier.position.set(0,pinOffset,0); pinCarrier.add(crankPin); crankGroup.add(pinCarrier);
    pumpjackGroup.add(crankGroup);
    // Pitman arms (left/right) – connect crank pin to equalizer underside
    function makePitman() { return new THREE.Mesh(new THREE.BoxGeometry(0.10,0.55,0.10), new THREE.MeshStandardMaterial({ color:0x88949c, metalness:0.55, roughness:0.38 })); }
    const pitmanArmL = makePitman(); pitmanArmL.position.set(-0.10,0.25,-0.18); pumpjackGroup.add(pitmanArmL);
    const pitmanArmR = makePitman(); pitmanArmR.position.set(-0.10,0.25,0.18); pumpjackGroup.add(pitmanArmR);
    // Gear reducer + motor + belt
    const reducer = new THREE.Mesh(new THREE.BoxGeometry(0.42,0.30,0.34), new THREE.MeshStandardMaterial({ color:0x46555e, metalness:0.55, roughness:0.45 }));
    reducer.position.set(-0.45,0.30,0); pumpjackGroup.add(reducer);
  const pjMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.46,24), new THREE.MeshStandardMaterial({ color:0x5d6c74, metalness:0.55, roughness:0.38 }));
  pjMotor.rotation.z = Math.PI/2; pjMotor.position.set(-0.15,0.33,0); pumpjackGroup.add(pjMotor);
  let belt: any;
  try { belt = new THREE.Mesh(new (THREE as any).TorusGeometry(0.28,0.02,10,32), new THREE.MeshStandardMaterial({ color:0x2a2f31, metalness:0.3, roughness:0.9 })); }
  catch { belt = new THREE.Mesh(new THREE.CylinderGeometry(0.30,0.30,0.02,24), new THREE.MeshStandardMaterial({ color:0x2a2f31, metalness:0.3, roughness:0.9 })); }
  belt.position.set(-0.32,0.40,0); pumpjackGroup.add(belt);
    const beltGuard = new THREE.Mesh(new THREE.BoxGeometry(0.60,0.28,0.40), new THREE.MeshStandardMaterial({ color:0x2f3d44, metalness:0.35, roughness:0.55, transparent:true, opacity:0.25 }));
    beltGuard.position.set(-0.32,0.40,0); pumpjackGroup.add(beltGuard);
    // Store references needed in animation
  (pumpjackGroup as any).userData = { beamPivot, pitmanArmL, pitmanArmR, pinCarrier, polishRod, horseHead, belt };
    pumpjackGroup.position.set(0,0,0);
    if (realismEnabled) pumpjackGroup.traverse(o=> { if ((o as any).isMesh){ (o as any).castShadow = true; (o as any).receiveShadow = true; }});
    scene.add(pumpjackGroup);

  // Flare stack with improved procedural flame (billboard volumetric impostor + inner core)
    const flareStack = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,1.3,28), new THREE.MeshStandardMaterial({ color:0x6b7280, metalness:0.5, roughness:0.6 }));
      // Move flare further out for visual breathing room
      flareStack.position.set(5.2,0.65,-2.4);
    if (realismEnabled) { (flareStack as any).castShadow = true; (flareStack as any).receiveShadow = true; }
    scene.add(flareStack);
    const flameGroup = new THREE.Group();
    flameGroup.position.copy(flareStack.position).add(new THREE.Vector3(0,0.75,0));
    scene.add(flameGroup);
  const flameHeight = 1.35; // total procedural flame height
    // Billboard main flame (impostor sampling pseudo-volume via layered noise)
    const flameBillboardGeo = new (THREE as any).PlaneGeometry(1.25, flameHeight, 32, 64);
    flameBillboardGeo.translate(0, flameHeight/2, 0);
    const flameMat = new (THREE as any).ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: (THREE as any).AdditiveBlending ?? 2,
      uniforms: { uTime:{ value:0 }, uIntensity:{ value:1.0 }, uTurbBoost:{ value:1.0 }, uSize:{ value:1.0 }, uColorBias:{ value:0.0 }, uLick:{ value:0.9 } },
      vertexShader:`varying vec2 vUv; varying float vY; varying float vYN; uniform float uTime; uniform float uSize; float hash(float n){return fract(sin(n)*43758.5453);} float noise(vec3 x){vec3 p=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f); float n=p.x+p.y*57.0+113.0*p.z; float r=mix(mix(mix(hash(n+0.0),hash(n+1.0),f.x),mix(hash(n+57.0),hash(n+58.0),f.x),f.y),mix(mix(hash(n+113.0),hash(n+114.0),f.x),mix(hash(n+170.0),hash(n+171.0),f.x),f.y),f.z); return r;} float fbm(vec3 p){float v=0.; float a=0.55; for(int i=0;i<5;i++){v+=a*noise(p); p*=2.07; a*=0.5;} return v;} void main(){ vUv=uv; vY=position.y; vec3 p=position; float h=` + '1.35' + `; float yN=clamp(p.y/h,0.,1.); vYN = yN; float t=uTime; float breath=0.06*sin(t*2.1)+0.035*sin(t*1.17+2.0); float width = mix(1.0, 0.42, pow(yN,1.25)); float macro = (1.0 + breath*(1.0 - yN*0.85))*uSize; float n = fbm(vec3(p.x*3.0, yN*3.5 + t*1.2, t*0.55)); float sway = (n*2.0-1.0)*0.22*(1.0 - yN*0.5); p.x = p.x * width * macro + sway; p.y += sin(t*5.5 + p.x*5.0)*0.022*(1.0 - yN*0.4); // subtle crown lift
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader:`varying vec2 vUv; varying float vY; varying float vYN; uniform float uTime; uniform float uIntensity; uniform float uTurbBoost; uniform float uColorBias; uniform float uLick; float hash(float n){return fract(sin(n)*43758.5453);} float noise(vec3 x){vec3 p=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f); float n=p.x+p.y*57.0+113.0*p.z; float r=mix(mix(mix(hash(n+0.0),hash(n+1.0),f.x),mix(hash(n+57.0),hash(n+58.0),f.x),f.y),mix(mix(hash(n+113.0),hash(n+114.0),f.x),mix(hash(n+170.0),hash(n+171.0),f.x),f.y),f.z); return r;} float fbm(vec3 p){float v=0.; float a=0.55; for(int i=0;i<6;i++){v+=a*noise(p); p*=2.15; a*=0.5;} return v;} vec3 bb(float tK){float t=tK/1000.0; float r,g,b; if(t<=0.0){return vec3(0.0);} if(t<1.0){r=0.0;} else if(t<=6.0){r=1.0;} else {r=1.0;} if(t<=2.0){g=0.0;} else if(t<=6.0){g=clamp(0.390081578769*log(t)-0.631841443788,0.0,1.0);} else {g=1.0;} if(t>=6.5){b=1.0;} else if(t<=1.9){b=0.0;} else {b=clamp(0.543206789110*log(t)-1.19625408914,0.0,1.0);} return vec3(r,g,b);} void main(){ float h=` + '1.35' + `; float y=vY/h; float t=uTime; float x=(vUv.x*2.0-1.0); float core = 1.0 - clamp(abs(x),0.0,1.0); core = pow(core,1.3); // tapered mask computed in vertex
        // layered noise fields
        float nLow = fbm(vec3(x*2.4, y*3.6 + t*1.4, t*0.55));
        float nHi = fbm(vec3(x*7.5 + 10.0, y*9.5 + t*3.2, t*1.2));
        float tongues = fbm(vec3(x*14.0, y*22.0 + t*5.2, t*2.5));
        // tongues shaping: only upper region & edges
        float edge = smoothstep(0.15,0.85,core);
        float crown = smoothstep(0.35,0.92,y);
        float lick = (tongues*2.0-1.0) * (1.0 - edge) * crown * uLick; // outward irregularities
        float baseShape = smoothstep(0.02,0.10,y) * (1.0 - smoothstep(0.72,0.995,y));
        float turbulence = (nLow*0.55 + nHi*0.45) * uTurbBoost;
        float flick = sin(t*17.0 + y*40.0)*0.08 + sin(t*9.1 + y*14.0)*0.06;
        float intensity = core*baseShape + turbulence*0.55 + flick;
        intensity += lick*0.35; // add tongues effect
        intensity = clamp(intensity,0.0,1.0);
        // dynamic temperature gradient
        float tLow = 1250.0 + uColorBias*140.0;
        float tMid = 1850.0 + uColorBias*170.0;
        float tHigh = 1050.0 + uColorBias*120.0;
        float temp = mix(tLow, tMid, smoothstep(0.0,0.42,y)); temp = mix(temp, tHigh, smoothstep(0.55,1.0,y));
        vec3 bbCol = bb(temp);
        // slight desaturation & orange shift near top
        bbCol = mix(bbCol, vec3(bbCol.r, bbCol.g*0.9, bbCol.b*0.7), smoothstep(0.4,1.0,y)*0.45);
        // inner dark pockets
        float pockets = fbm(vec3(x*18.0, y*32.0 + t*8.0, t*3.5));
        float pocketMask = smoothstep(0.15,0.85,core) * smoothstep(0.05,0.6,y) * 0.35;
        bbCol *= (1.0 - pocketMask * (pockets*0.55));
        vec3 col = bbCol * (0.42 + intensity*1.22*uIntensity);
        float radialEdge = smoothstep(0.0,0.14,core);
        float alpha = intensity * radialEdge * (1.0 - y*0.24);
        // thin out at top for wispy taper
        alpha *= (1.0 - smoothstep(0.82,0.995,y));
        // smoke fade above – subtle dark halo (not additive to color here, we let halo mesh add glow)
        if(alpha < 0.015) discard; gl_FragColor = vec4(col, alpha);
      }`
    });
    const flameBillboard = new (THREE as any).Mesh(flameBillboardGeo, flameMat);
    flameGroup.add(flameBillboard);
    // Inner bright core (small tapered cylinder)
    const coreGeo = new (THREE as any).CylinderGeometry(0.18,0.10,0.55,24,1);
    const coreMat = new (THREE as any).ShaderMaterial({
      transparent:true, depthWrite:false, blending:(THREE as any).AdditiveBlending ?? 2,
      uniforms:{ uTime:{ value:0 }, uIntensity:{ value:1.0 }, uColorBias:{ value:0.0 } },
      vertexShader:`varying float vY; uniform float uTime; void main(){ vY = position.y + 0.275; vec3 p=position; float t=uTime; p.x += sin(t*25.0 + p.y*35.0)*0.01; p.z += sin(t*18.0 + p.y*42.0)*0.01; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader:`varying float vY; uniform float uTime; uniform float uIntensity; uniform float uColorBias; vec3 bb(float tK){float t=tK/1000.0; float r,g,b; if(t<=0.0){return vec3(0.0);} if(t<1.0){r=0.0;} else if(t<=6.0){r=1.0;} else {r=1.0;} if(t<=2.0){g=0.0;} else if(t<=6.0){g=clamp(0.390081578769*log(t)-0.631841443788,0.0,1.0);} else {g=1.0;} if(t>=6.5){b=1.0;} else if(t<=1.9){b=0.0;} else {b=clamp(0.543206789110*log(t)-1.19625408914,0.0,1.0);} return vec3(r,g,b);} void main(){ float y = clamp(vY/0.55,0.0,1.0); float temp = mix(1850.0 + uColorBias*120.0, 1400.0 + uColorBias*100.0, y); vec3 col = bb(temp); col *= (1.2 - y*0.4) * uIntensity; float intensity = (1.0 - y) * (0.75 + sin(uTime*30.0 + y*50.0)*0.15); float alpha = intensity * (1.0 - y*0.65); if(alpha < 0.03) discard; gl_FragColor = vec4(col, alpha); }`
    });
    const coreMesh = new (THREE as any).Mesh(coreGeo, coreMat);
    coreMesh.position.y = 0.55/2; // seat at base
    flameGroup.add(coreMesh);
    (flameGroup as any).userData.mainFlameMaterial = flameMat;
    (flameGroup as any).userData.coreFlameMaterial = coreMat;
    (flameGroup as any).userData.billboard = flameBillboard;
    // Add halo sprite (radial additive glow) for subtle peripheral light
    const haloGeo = new (THREE as any).PlaneGeometry(2.0,2.0,1,1);
    const haloMat = new (THREE as any).ShaderMaterial({
      transparent:true, depthWrite:false, blending:(THREE as any).AdditiveBlending ?? 2,
      uniforms:{ uTime:{ value:0 }, uIntensity:{ value:1.0 } },
      vertexShader:`varying vec2 vUv; uniform float uTime; uniform float uIntensity; void main(){ vUv=uv; vec3 p=position; float t=uTime; float pulse = (0.06*sin(t*3.2)+0.04*sin(t*7.1+1.0))*uIntensity; p.xy *= (1.0 + pulse); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader:`varying vec2 vUv; uniform float uTime; uniform float uIntensity; void main(){ vec2 c = vUv - 0.5; float r = length(c)*2.0; float base = pow(max(0.0,1.0-r),1.75); float t=uTime; float flick = 0.25 + 0.25*sin(t*6.0)+0.15*sin(t*11.3+2.0); float a = base * (0.35 + flick) * uIntensity; vec3 col = mix(vec3(1.0,0.55,0.15), vec3(1.0,0.75,0.35), pow(base,0.6)); a *= 0.55; if(a<0.01) discard; gl_FragColor=vec4(col,a); }`
    });
    const haloMesh = new (THREE as any).Mesh(haloGeo, haloMat);
    haloMesh.position.y = flameHeight*0.45; // center around mid flame
    flameGroup.add(haloMesh);
    (flameGroup as any).userData.halo = haloMesh;
    // (Removed legacy multi-sheet flame planes)
    // Volumetric flare glow approximation (billboard planes)
  const flareGlowGroup = new THREE.Group();
    flareGlowGroup.position.copy(flameGroup.position);
    interface GlowPlane { mesh: THREE.Mesh; base: number; color: number; baseOpacity: number; }
    const flareGlowPlanes: GlowPlane[] = [];
    const ADD_BLEND = (THREE as any).AdditiveBlending ?? 2; // fallback numeric
    function makeGlowPlane(size:number, color:number, opacity:number) {
      const geo = new (THREE as any).PlaneGeometry(1,1);
      const mat = new (THREE as any).MeshBasicMaterial({ color, transparent:true, opacity, blending:ADD_BLEND, depthWrite:false });
      const mesh = new (THREE as any).Mesh(geo, mat);
      mesh.scale.set(size,size,size);
      flareGlowGroup.add(mesh);
      flareGlowPlanes.push({ mesh, base:size, color, baseOpacity:opacity });
    }
    const ENABLE_FLARE_GLOW = false; // disabled: remove square glow planes per request
    if (realismEnabled && ENABLE_FLARE_GLOW) {
      makeGlowPlane(0.9, 0xff9a3a, 0.28);
      makeGlowPlane(1.4, 0xff6a1b, 0.18);
      makeGlowPlane(2.1, 0xffe4b0, 0.08);
      scene.add(flareGlowGroup);
    }

    // Knockout Drum (KO Drum) – detailed vertical vessel capturing liquids before flare
    const koDrumGroup = new THREE.Group();
    koDrumGroup.position.set(4.0,0,-2.2); // anchor at ground
    const koRadius = 0.32; const koShellHeight = 1.05;
    const koMat = new THREE.MeshStandardMaterial({ color:0x5b6972, metalness:0.55, roughness:0.45, emissive:0x0d1418, emissiveIntensity:0.20 });
    // Main shell
    const koShell = new THREE.Mesh(new THREE.CylinderGeometry(koRadius, koRadius, koShellHeight, 40, 1), koMat);
    koShell.position.y = koShellHeight/2 + 0.12;
    koDrumGroup.add(koShell);
    // Elliptical heads (scaled spheres)
    const headGeoKO = new THREE.SphereGeometry(koRadius, 36, 24);
    const headBottom = new THREE.Mesh(headGeoKO, koMat.clone()); headBottom.scale.set(1,0.55,1); headBottom.position.y = 0.12; koDrumGroup.add(headBottom);
    const headTop = new THREE.Mesh(headGeoKO, koMat.clone()); headTop.scale.set(1,0.55,1); headTop.position.y = koShell.position.y + koShellHeight/2; koDrumGroup.add(headTop);
    // Support base ring + legs
    const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(koRadius*0.95, koRadius*0.95, 0.08, 32), new THREE.MeshStandardMaterial({ color:0x22303a, metalness:0.25, roughness:0.85 }));
    baseRing.position.y = 0.04; koDrumGroup.add(baseRing);
  const koLegMat = new THREE.MeshStandardMaterial({ color:0x2c3942, metalness:0.3, roughness:0.8 });
    for (let i=0;i<4;i++) {
      const ang = i*Math.PI/2 + Math.PI/4;
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.20,0.16), koLegMat);
      leg.position.set(Math.cos(ang)*koRadius*0.65, 0.10, Math.sin(ang)*koRadius*0.65);
      koDrumGroup.add(leg);
    }
    // Manway (side) with cover & bolt ring
    const manwayMatKO = new THREE.MeshStandardMaterial({ color:0x6c7a83, metalness:0.5, roughness:0.5, emissive:0x0f1416, emissiveIntensity:0.18 });
    const manway = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.05, 26), manwayMatKO);
    manway.rotation.x = Math.PI/2; manway.position.set(koRadius*0.98, koShell.position.y - 0.15, 0);
    koDrumGroup.add(manway);
    // Sight glass (level gauge) – vertical tube w/ inner colored fluid portion
    const gaugeFrameMat = new THREE.MeshStandardMaterial({ color:0x1b2d33, metalness:0.2, roughness:0.75, emissive:0x0a5e8f, emissiveIntensity:0.35 });
    const sightGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03, koShellHeight*0.75, 14), gaugeFrameMat);
    sightGlass.position.set(-koRadius*0.95, koShell.position.y, -koRadius*0.55);
    koDrumGroup.add(sightGlass);
    // Liquid level indicator (simple emissive bar inside)
    const levelFrac = 0.45; // static mock level fraction
    const fluid = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018, koShellHeight*0.75*levelFrac, 12), new THREE.MeshStandardMaterial({ color:0x1c92c0, metalness:0.1, roughness:0.25, emissive:0x0cb8ff, emissiveIntensity:0.9, transparent:true, opacity:0.85 }));
    fluid.position.set(sightGlass.position.x, sightGlass.position.y - (koShellHeight*0.75*(1-levelFrac)/2), sightGlass.position.z);
    koDrumGroup.add(fluid);
    // Nozzles: inlet (from flare header), gas outlet to stack, drain, vent/PSV
    const nozzleMatKO = new THREE.MeshStandardMaterial({ color:0x95a4ae, metalness:0.55, roughness:0.38, emissive:0x121a1e, emissiveIntensity:0.25 });
    // Inlet (mid height, -X direction)
    const inletKO = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.55,22), nozzleMatKO);
    inletKO.rotation.z = Math.PI/2; inletKO.position.set(-koRadius*1.15, koShell.position.y, 0);
    koDrumGroup.add(inletKO);
    // Gas outlet (upper, +X to flare stack)
    const gasOutlet = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.65,22), nozzleMatKO.clone());
    gasOutlet.rotation.z = Math.PI/2; gasOutlet.position.set(koRadius*1.15, koShell.position.y + 0.20, 0.02);
    koDrumGroup.add(gasOutlet);
    // Drain (bottom vertical then horizontal stub)
    const drainVert = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.25,16), nozzleMatKO.clone()); drainVert.position.set(-0.06, 0.12+0.125, koRadius*0.55); koDrumGroup.add(drainVert);
    const drainHoriz = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.38,16), nozzleMatKO.clone()); drainHoriz.rotation.x = Math.PI/2; drainHoriz.position.set(-0.06, 0.12+0.25, koRadius*0.55+0.19); koDrumGroup.add(drainHoriz);
    // PSV / Vent stack
    const psvBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.22,16), nozzleMatKO.clone()); psvBase.position.set(0.0, headTop.position.y + 0.15, 0.0); koDrumGroup.add(psvBase);
    const psvCap = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.05,0.1,16), nozzleMatKO.clone()); psvCap.position.set(0.0, psvBase.position.y + 0.16, 0.0); koDrumGroup.add(psvCap);
    // Ladder (reoriented so width is tangent to vessel side)
    const ladderGroup = new THREE.Group();
    const koRailMat = new THREE.MeshStandardMaterial({ color:0xc9d2d7, metalness:0.55, roughness:0.35 });
    // Choose azimuth angle where ladder sits (around back-right quadrant)
    const ladderAngle = Math.PI * 0.25; // 45 degrees
    const offsetX = Math.cos(ladderAngle) * (koRadius * 0.98);
    const offsetZ = Math.sin(ladderAngle) * (koRadius * 0.98);
    // We align rails along Y, and their separation along local +X of ladderGroup; orient ladderGroup to face shell center.
    ladderGroup.position.set(offsetX, koShell.position.y, offsetZ);
  (ladderGroup as any).lookAt(0, koShell.position.y, 0); // face drum center (cast for TS)
    // After lookAt, scale/translate rails in local space: rails separated along local X
    const railSeparation = 0.18;
  const ladderRailHeight = koShellHeight + 0.35;
    function makeRail(xLocal: number) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, ladderRailHeight, 0.03), koRailMat);
      rail.position.set(xLocal, 0, 0);
      return rail;
    }
    const railL = makeRail(-railSeparation/2);
    const railR = makeRail( railSeparation/2);
    ladderGroup.add(railL, railR);
    const rungCount = 8; const rungSpan = ladderRailHeight/(rungCount-1);
    for (let i=0;i<rungCount;i++) {
      const y = -ladderRailHeight/2 + i*rungSpan;
      const rung = new THREE.Mesh(new THREE.BoxGeometry(railSeparation+0.03,0.015,0.05), koRailMat.clone());
      rung.position.set(0, y, 0);
      ladderGroup.add(rung);
    }
    koDrumGroup.add(ladderGroup);
    if (realismEnabled) koDrumGroup.traverse(o=> { if ((o as any).isMesh){ (o as any).castShadow = true; (o as any).receiveShadow = true; }});
    scene.add(koDrumGroup);

    // Separator (three-phase horizontal vessel with saddles, manways, walkway & piping)
    const separatorGroup = new THREE.Group();
    separatorGroup.position.set(-2.0, 0, 3.2); // group anchor; pipelines & label reference this position
    const sepLength = 3.2; // overall tangent-to-tangent length (approx)
    const sepRadius = 0.48;
    const sepShellLen = sepLength - sepRadius * 0.9; // subtract for elliptical heads overlap
    const sepMat = new THREE.MeshStandardMaterial({ color:0x778b94, metalness:0.58, roughness:0.34, emissive:0x0d1418, emissiveIntensity:0.22 });
    // Main shell (rotate so cylinder axis runs along X)
    const sepShell = new THREE.Mesh(new THREE.CylinderGeometry(sepRadius, sepRadius, sepShellLen, 40, 1), sepMat);
    sepShell.rotation.z = Math.PI / 2;
    sepShell.position.set(0, 0.75, 0);
    separatorGroup.add(sepShell);
    // Elliptical heads (scaled spheres)
    const headGeo = new THREE.SphereGeometry(sepRadius, 36, 24);
    const headA = new THREE.Mesh(headGeo, sepMat.clone());
    headA.scale.set(0.82, 1, 1); // slight ellipse
    headA.position.set(-sepShellLen / 2, 0.75, 0);
    const headB = new THREE.Mesh(headGeo, sepMat.clone());
    headB.scale.set(0.82, 1, 1);
    headB.position.set(sepShellLen / 2, 0.75, 0);
    separatorGroup.add(headA, headB);
    // Support saddles
    const saddleMat = new THREE.MeshStandardMaterial({ color:0x2f3940, metalness:0.3, roughness:0.8 });
    function makeSaddle(x: number) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.9), saddleMat);
      base.position.set(0, 0.05, 0);
      const web = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), new THREE.MeshStandardMaterial({ color:0x39444b, metalness:0.25, roughness:0.85 }));
      web.position.set(0, 0.35, 0);
      g.add(base, web);
      g.position.set(x, 0, 0);
      return g;
    }
    const saddleOffset = (sepShellLen * 0.4) / 2;
    separatorGroup.add(makeSaddle(-saddleOffset), makeSaddle(saddleOffset));
    // Manways (side access covers with simplified bolt ring)
    const manwayMat = new THREE.MeshStandardMaterial({ color:0x6c7f88, metalness:0.5, roughness:0.55, emissive:0x0d1012, emissiveIntensity:0.15 });
    const manwayPositions = [-sepShellLen * 0.25, -sepShellLen * 0.05, sepShellLen * 0.15, sepShellLen * 0.35];
    manwayPositions.forEach(mx => {
      const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 24), manwayMat.clone());
      cover.position.set(mx, 0.75, sepRadius * 0.82); // front side of shell
      cover.rotation.x = Math.PI / 2;
      separatorGroup.add(cover);
    });
    // Top walkway platform
    const walkY = 0.75 + sepRadius + 0.12;
    const walkway = new THREE.Mesh(new THREE.BoxGeometry(sepShellLen * 0.9, 0.05, 0.6), new THREE.MeshStandardMaterial({ color:0x3a4750, metalness:0.25, roughness:0.7 }));
    walkway.position.set(0, walkY, 0);
    separatorGroup.add(walkway);
    // Handrails (simple posts + top rail)
    const railGroup = new THREE.Group();
    const railMat = new THREE.MeshStandardMaterial({ color:0xbac8cf, metalness:0.6, roughness:0.3 });
    const railHeight = 0.42;
    const postSpacing = 0.35;
    for (let x = -sepShellLen * 0.45; x <= sepShellLen * 0.45; x += postSpacing) {
      // two side rails
      [0.3, -0.3].forEach(z => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, railHeight, 8), railMat);
        post.position.set(x, walkY + railHeight / 2, z);
        railGroup.add(post);
      });
    }
    // Top longitudinal rails
    [0.3, -0.3].forEach(z => {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, sepShellLen * 0.9, 12), railMat);
      bar.rotation.z = Math.PI / 2; // align along X
      bar.position.set(0, walkY + railHeight - 0.02, z);
      railGroup.add(bar);
    });
    separatorGroup.add(railGroup);
    // Safety relief valves (PSVs) on top
    const psvMat = new THREE.MeshStandardMaterial({ color:0xd4dfec, metalness:0.4, roughness:0.55, emissive:0x111111, emissiveIntensity:0.3 });
    function addPSV(x: number) {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.28, 16), psvMat);
      body.position.set(x, walkY + 0.28 / 2 + 0.05, -0.05);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.08, 16), psvMat.clone());
      cap.position.set(x, body.position.y + 0.18, -0.05);
      separatorGroup.add(body, cap);
    }
    addPSV(-0.4); addPSV(0.15);
    // Updated separator piping for more realistic layout:
    //  - Inlet enters mid-left at vessel centerline (no tall drop from walkway)
    //  - Gas outlet rises from top near right side then exits horizontally
    //  - Oil outlet at lower side (mid-right) above water draw
    //  - Water outlet lowest, near right head
    const flarePipeMat = new THREE.MeshStandardMaterial({ color:0x96a6ad, metalness:0.55, roughness:0.4 });
    // Inlet (approach from left, along +X toward head, stops just before shell then would internally divert)
    const inletRun = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.85,18), flarePipeMat);
    inletRun.rotation.z = Math.PI/2; // along X
    inletRun.position.set(-sepShellLen*0.60, 0.75, 0); // centerline height
    separatorGroup.add(inletRun);
    const inletStub = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.30,18), flarePipeMat.clone());
    inletStub.rotation.z = Math.PI/2;
    inletStub.position.set(-sepShellLen*0.60 + 0.40, 0.75, 0);
    separatorGroup.add(inletStub);
    // Gas outlet (vertical riser from top then horizontal)
    const gasRiser = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.45,16), flarePipeMat.clone());
    gasRiser.position.set(sepShellLen*0.28, 0.75 + sepRadius + 0.45/2, 0); // top center area near right
    const gasOut = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.95,16), flarePipeMat.clone());
    gasOut.rotation.z = Math.PI/2;
    gasOut.position.set(sepShellLen*0.28 + 0.475, 0.75 + sepRadius + 0.45, 0); // horizontal away
    separatorGroup.add(gasRiser, gasOut);
    // Oil outlet (side, slightly below center)
    const oilOutlet = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.42,16), flarePipeMat.clone());
    oilOutlet.rotation.x = Math.PI/2; // along Z
    oilOutlet.position.set(sepShellLen*0.34, 0.58, sepRadius + 0.24);
    separatorGroup.add(oilOutlet);
    // Water outlet (lowest side nozzle)
    const waterOutlet = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.38,16), flarePipeMat.clone());
    waterOutlet.rotation.x = Math.PI/2;
    waterOutlet.position.set(sepShellLen*0.30, 0.40, sepRadius + 0.20);
    separatorGroup.add(waterOutlet);
    // Level gauge (simplified sight glass)
    const lvlMat = new THREE.MeshStandardMaterial({ color:0x1b2d33, metalness:0.2, roughness:0.7, emissive:0x0ab3ff, emissiveIntensity:0.8 });
    const levelGauge = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 12), lvlMat);
    levelGauge.position.set(sepShellLen * 0.02, 0.75, -sepRadius * 0.9);
    separatorGroup.add(levelGauge);
    if (realismEnabled) separatorGroup.traverse(o => { if ((o as any).isMesh) { (o as any).castShadow = true; (o as any).receiveShadow = true; } });
    scene.add(separatorGroup);

    // Manifold Skid (multi-header with valves & handwheels) replacing simple block
    const manifoldGroup = new THREE.Group();
    manifoldGroup.position.set(3.5,0,2.4); // anchor
    // Skid base
    const skidMat = new THREE.MeshStandardMaterial({ color:0x1f2c36, metalness:0.25, roughness:0.85 });
    const skidBase = new THREE.Mesh(new THREE.BoxGeometry(1.9,0.08,1.1), skidMat);
    skidBase.position.set(0,0.04,0);
    manifoldGroup.add(skidBase);
    // Grating surface
    const grating = new THREE.Mesh(new THREE.BoxGeometry(1.82,0.02,1.02), new THREE.MeshStandardMaterial({ color:0x2c3b47, metalness:0.2, roughness:0.7, emissive:0x0a1216, emissiveIntensity:0.15 }));
    grating.position.set(0,0.09,0);
    manifoldGroup.add(grating);
    // Parallel header pipes (e.g., test & production headers) with branch valves
  const pipeMat = new THREE.MeshStandardMaterial({ color:0x9aa8b3, metalness:0.55, roughness:0.32, emissive:0x0e1214, emissiveIntensity:0.18 });
    const valveBodyMat = new THREE.MeshStandardMaterial({ color:0x365b7a, metalness:0.55, roughness:0.4, emissive:0x12222b, emissiveIntensity:0.3 });
    const accentMat = new THREE.MeshStandardMaterial({ color:0xffd34d, metalness:0.4, roughness:0.45, emissive:0x2b1f00, emissiveIntensity:0.45 });
    const wheelMat = new THREE.MeshStandardMaterial({ color:0xd8e2e8, metalness:0.6, roughness:0.35, emissive:0x0f1416, emissiveIntensity:0.35 });
    function makeWheel(r=0.11, t=0.02) {
      const g = new THREE.Group();
      const rim = new THREE.Mesh(new (THREE as any).TorusGeometry(r, t*0.5, 10, 28), wheelMat);
      rim.rotation.x = Math.PI/2; g.add(rim);
      for (let i=0;i<4;i++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(t*0.55, t*0.55, r*1.6), wheelMat);
        spoke.rotation.x = Math.PI/2; spoke.rotation.y = i*Math.PI/2; g.add(spoke);
      }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(t*0.9,t*0.9,t*2.2,12), wheelMat); hub.rotation.x = Math.PI/2; g.add(hub);
      return g;
    }
    function makeInlineValve(d=0.14, len=0.26) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(d*0.75,d*0.75,len*0.85,20), valveBodyMat);
      body.rotation.z = Math.PI/2; g.add(body);
  const fl1 = new THREE.Mesh(new THREE.CylinderGeometry(d*0.55,d*0.55,0.05,18), accentMat); fl1.rotation.z = Math.PI/2; fl1.position.x = -len*0.45; g.add(fl1);
  const fl2 = new THREE.Mesh(new THREE.CylinderGeometry(d*0.55,d*0.55,0.05,18), accentMat.clone()); fl2.rotation.z = Math.PI/2; fl2.position.x = len*0.45; g.add(fl2);
      const wheel = makeWheel(d*0.55, d*0.11); wheel.position.y = d*0.55; g.add(wheel);
      return g;
    }
    // Create headers
    interface HeaderDef { y: number; z: number; key: string }
    const headers: HeaderDef[] = [
      { y: 0.28, z: 0.36, key: 'upper' },
      { y: 0.20, z: 0.10, key: 'mid' },
      { y: 0.12, z: -0.16, key: 'lower' }
    ];
    const headerLength = 1.72;
    const branchCount = 4;
    headers.forEach((h, rowIdx) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09, headerLength, 40), pipeMat.clone());
      pipe.rotation.z = Math.PI/2; pipe.position.set(0, h.y, h.z);
      manifoldGroup.add(pipe);
      // Branch valves along pipe (spaced evenly)
      for (let i=0;i<branchCount;i++) {
        const t = (i/(branchCount-1)) - 0.5; // -0.5..0.5
        const valve = makeInlineValve(0.12, 0.30);
        valve.position.set(t*headerLength*0.92, h.y + 0.03, h.z + 0.0);
        manifoldGroup.add(valve);
        // Outlet short stub downward (simulate drop to lower header / piping)
        if (rowIdx === 0) { // only from top header downward
          const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055, h.y - 0.09, 16), pipeMat.clone());
          drop.position.set(valve.position.x, (h.y + 0.09)/2 + 0.09, h.z + 0.32);
          manifoldGroup.add(drop);
        }
      }
    });
    // End connection flanges / caps
    function addEndCaps(y:number, z:number) {
  const capA = new THREE.Mesh(new THREE.CylinderGeometry(0.095,0.095,0.06,18), accentMat.clone()); capA.rotation.z = Math.PI/2; capA.position.set(-headerLength*0.5, y, z); manifoldGroup.add(capA);
  const capB = new THREE.Mesh(new THREE.CylinderGeometry(0.095,0.095,0.06,18), accentMat.clone()); capB.rotation.z = Math.PI/2; capB.position.set(headerLength*0.5, y, z); manifoldGroup.add(capB);
    }
    headers.forEach(h => addEndCaps(h.y, h.z));
    // Lateral gathering header (collecting from branches) – front side
    const gather = new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.11, 0.95, 30), pipeMat.clone());
    gather.rotation.x = Math.PI/2; gather.position.set(-headerLength*0.25, 0.18, 0.52);
    manifoldGroup.add(gather);
    // Outlet line leaving skid
  const skidOutlet = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.85,28), pipeMat.clone());
  skidOutlet.rotation.z = Math.PI/2; skidOutlet.position.set(headerLength*0.4, 0.22, 0.52);
  manifoldGroup.add(skidOutlet);
    // Supports (vertical posts under headers)
    for (let i=0;i<5;i++) {
      const t = (i/4 - 0.5) * headerLength*0.95;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, headers[0].y, 0.07), skidMat.clone());
      post.position.set(t, headers[0].y/2, 0.02);
      manifoldGroup.add(post);
    }
    if (realismEnabled) manifoldGroup.traverse(o=> { if ((o as any).isMesh){ (o as any).castShadow = true; (o as any).receiveShadow = true; }});
    scene.add(manifoldGroup);

    // Wellheads + Christmas Trees (enhanced detail)
    const wellheadGroup = new THREE.Group();
    // Utility constructors
    const matBody = new THREE.MeshStandardMaterial({ color:0x3f6e91, metalness:0.55, roughness:0.38, emissive:0x0a1216, emissiveIntensity:0.18 });
    const matValve = new THREE.MeshStandardMaterial({ color:0x4d85a8, metalness:0.55, roughness:0.4, emissive:0x0d161b, emissiveIntensity:0.25 });
    const matWheel = new THREE.MeshStandardMaterial({ color:0x121a1f, metalness:0.3, roughness:0.6 });
    function makeHandWheel(radius:number, thickness=0.05) {
      const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new (THREE as any).TorusGeometry(radius, thickness*0.5, 10, 32), matWheel);
      rim.rotation.x = Math.PI/2;
      wheel.add(rim);
      // spokes
      for (let i=0;i<3;i++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(thickness*0.4, thickness*0.4, radius*1.6), matWheel);
        spoke.position.z = 0;
        spoke.rotation.y = (i/3)*Math.PI*2;
        spoke.rotation.x = Math.PI/2;
        wheel.add(spoke);
      }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(thickness*0.6, thickness*0.6, thickness*1.6, 12), matWheel);
      hub.rotation.x = Math.PI/2; wheel.add(hub);
      // Current construction leaves the wheel plane horizontal (axis vertical). Rotate group so plane is vertical.
      // Removing existing sub-rotations would require reshaping spokes; simpler to counter-rotate the group.
      wheel.rotation.x = -Math.PI/2; // stand wheel upright
      return wheel;
    }
    function makeValveBody(d=0.22, l=0.32, wheelR=0.16) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(d*0.55,d*0.55,l*0.55,20), matValve);
      body.rotation.x = Math.PI/2; // align along Z for lateral valves by default
      g.add(body);
      const wheel = makeHandWheel(wheelR);
      wheel.position.z = l*0.22;
      wheel.position.y = d*0.15;
      // Offset wheel outward on X so it is not embedded inside the valve body
      // Using 0.5*(diameter) + small clearance based on wheel radius
  // Previous offset placed wheel too far; bring it closer (edge + small clearance)
  wheel.position.x = (d*0.55) + wheelR*0.15;
      g.add(wheel);
      return g;
    }
    function makeMasterValve(height:number, radius:number, wheelR=0.22) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius*0.7,radius*0.7,height*0.55,24), matValve);
      body.position.y = height*0.275;
      group.add(body);
      const wheel = makeHandWheel(wheelR);
      wheel.position.y = height*0.55;
      // Reposition & rotate: instead of offsetting on X (causing embed), push out on Z (front) and rotate
      // so the wheel face is oriented toward the camera/front.
      wheel.position.x = 0;
      wheel.position.z = radius*0.70 + wheelR*0.15; // outward from stack
      wheel.rotation.y = Math.PI/2; // rotate 90° so hand wheel plane faces outward after Z offset
      group.add(wheel);
      return group;
    }
    function makeWellheadTree(pos:THREE.Vector3) {
      const root = new THREE.Group(); root.position.copy(pos);
      // Wellhead stack (casing head, spools)
      const stackHeights = [0.35,0.28,0.28,0.24];
      let yAcc = 0;
      stackHeights.forEach((h,i) => {
        const r = 0.26 - i*0.025;
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,26,1), matBody);
        seg.position.y = yAcc + h/2;
        yAcc += h;
        root.add(seg);
        // side outlets on lower spools (simulate casing/annulus ports)
        if (i>0 && i < stackHeights.length-1) {
          const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.32,16), matBody);
          outlet.rotation.z = Math.PI/2;
          outlet.position.set( r*0.95, seg.position.y, 0);
          root.add(outlet);
        }
      });
      // Lower master valve
      const lowerMaster = makeMasterValve(0.32,0.24,0.19);
      lowerMaster.position.y = yAcc; yAcc += 0.32;
      root.add(lowerMaster);
      // Upper master valve
      const upperMaster = makeMasterValve(0.30,0.22,0.18);
      upperMaster.position.y = yAcc; yAcc += 0.30;
      root.add(upperMaster);
      // Tree cross
      const crossHeight = 0.28;
      const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,crossHeight,24), matBody);
      cross.position.y = yAcc + crossHeight/2;
      root.add(cross);
      // Wing valves (left & right)
      const wingLeft = makeValveBody(0.22,0.36,0.18);
      wingLeft.rotation.y = Math.PI/2; // orient wheel vertical
      wingLeft.position.set(-0.36, cross.position.y, 0);
      root.add(wingLeft);
      const wingRight = makeValveBody(0.22,0.36,0.18);
      wingRight.rotation.y = Math.PI/2;
      wingRight.position.set(0.36, cross.position.y, 0);
      root.add(wingRight);
      yAcc += crossHeight;
      // Swab valve (top at small spool)
      const swabSpool = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.18,24), matBody);
      swabSpool.position.y = yAcc + 0.09; root.add(swabSpool);
      const swabValve = makeMasterValve(0.22,0.16,0.14);
      swabValve.position.y = yAcc + 0.18; yAcc += 0.40; root.add(swabValve);
      // Gauge at top front
      const gaugeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.10,12), matBody);
      gaugeStem.position.set(0, swabValve.position.y + 0.25, 0.05);
      root.add(gaugeStem);
      const gaugeFace = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.02,24), new THREE.MeshStandardMaterial({ color:0xe2e8ec, metalness:0.2, roughness:0.6, emissive:0x111111, emissiveIntensity:0.35 }));
      gaugeFace.position.set(0, gaugeStem.position.y + 0.06, 0.05);
      root.add(gaugeFace);
      return root;
    }
    // Positions (retain spread but use detailed trees)
    const wellPositions = [ new THREE.Vector3(-1.5,0,-3.6), new THREE.Vector3(0.9,0,-3.9), new THREE.Vector3(3.0,0,-3.2) ];
    wellPositions.forEach(p => {
      const tree = makeWellheadTree(p);
      wellheadGroup.add(tree);
    });
    if (realismEnabled) wellheadGroup.traverse(o=> { if ((o as any).isMesh){ (o as any).castShadow = true; (o as any).receiveShadow = true; }});
    scene.add(wellheadGroup);

    // Pipelines (curves with tube geometry) radiating from rig to remote nodes
    interface Pipeline {
      curve: THREE.CatmullRomCurve3;
      mesh: THREE.Mesh;
      flows: { marker: THREE.Mesh; speed: number; progress: number; }[];
    }
    const pipelineGroup = new THREE.Group();
  const pipelineColors = [0x3d82b6, 0x2d9664, 0x8a582d]; // oil, gas, water
  const flowColor = new THREE.Color('#9ae6ff');
  const pipelineMaterial = new THREE.MeshStandardMaterial({ color: 0x34658c, metalness: 0.55, roughness:0.3 });

    const endpoints = [
      new THREE.Vector3(3.5,0.1,2.4), // to manifold (updated)
      new THREE.Vector3(-2.0,0.1,3.2), // to separator (updated)
      new THREE.Vector3(-5.5,0.1,-2.6) // to tanks (approx center of new cluster)
    ];

  const pipelines: Pipeline[] = endpoints.map((end, idx) => {
      const mid = end.clone().multiplyScalar(0.45).add(new THREE.Vector3(0, 0.4 + 0.15*idx, 0));
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.0,0.15,0.0),
        mid,
        end
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.06, 8, false);
      const meshMat = pipelineMaterial.clone();
      meshMat.color.setHex(pipelineColors[idx % pipelineColors.length]);
      const mesh = new THREE.Mesh(tubeGeo, meshMat);
      pipelineGroup.add(mesh);
      // flow markers
      const flows: Pipeline['flows'] = [];
      // Oil line (idx 0) gets a denser, faster pulse train to simulate continuous flow
      const flowCount = idx === 0 ? 14 : 4;
      for (let i=0;i<flowCount;i++) {
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(idx === 0 ? 0.03 : 0.045, 12, 12),
          new THREE.MeshBasicMaterial({ color: (() => { const c = new THREE.Color((flowColor as any).getHex ? (flowColor as any).getHex() : flowColor); if (idx === 0 && (c as any).offsetHSL) { (c as any).offsetHSL(0,0, Math.sin(i)*0.05); } return c; })() })
        );
        flows.push({
          marker,
          speed: (idx === 0 ? 0.22 : 0.12) + Math.random() * (idx === 0 ? 0.12 : 0.12),
          progress: i / flowCount
        });
        pipelineGroup.add(marker);
      }
      return { curve, mesh, flows };
    });
    scene.add(pipelineGroup);

    // Equipment nodes (manifold, separator, tanks positions reused) for highlight grouping
    const nodeRefs: THREE.Mesh[] = [];
  [manifoldGroup.position.clone(), separatorGroup.position.clone().add(new THREE.Vector3(0,0,0)), tanksGroup.position.clone()].forEach((pos) => {
      const proxy = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,0.01,4), new THREE.MeshBasicMaterial({ visible:false }));
      proxy.position.copy(pos);
      nodeRefs.push(proxy);
      scene.add(proxy);
    });

    // Gas shimmer (disabled) – previously rising particulate; kept toggle for future use
    const GAS_SHIMMER_ENABLED = false;
    let gasGeo: THREE.BufferGeometry | null = null; // retained for cleanup safety
    let gasCount = 0; // placeholder when disabled
    if (GAS_SHIMMER_ENABLED) {
      gasCount = 300;
      const gasPositions = new Float32Array(gasCount*3);
      for (let i=0;i<gasCount;i++) {
        gasPositions[i*3] = (Math.random()-0.5)*6;
        gasPositions[i*3+1] = Math.random()*1.5;
        gasPositions[i*3+2] = (Math.random()-0.5)*6;
      }
      gasGeo = new THREE.BufferGeometry();
      gasGeo.setAttribute('position', new THREE.BufferAttribute(gasPositions,3));
      const gasMat = new THREE.PointsMaterial({ size:0.028, color:0x84b7ff, transparent:true, opacity:0.5, depthWrite:false });
      const gasPoints = new THREE.Points(gasGeo, gasMat);
      scene.add(gasPoints);
    }

    // Heat haze shader plane (subtle) near flare stack
    let heatHazeGeom: any = null; let heatHazeMat: any = null; let heatHaze: any = null;
    if (realismEnabled) {
      heatHazeGeom = new (THREE as any).PlaneGeometry(1.2,2.2, 16,32);
      heatHazeMat = new (THREE as any).ShaderMaterial({
        transparent:true, depthWrite:false, blending:ADD_BLEND,
        uniforms:{ uTime:{ value:0 }},
        vertexShader:`varying vec2 vUv; uniform float uTime; void main(){ vUv=uv; vec3 p=position; p.x += sin(uv.y*10.0 + uTime*2.0)*0.02; p.z += sin(uv.x*8.0 + uTime*1.5)*0.02; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
        fragmentShader:`varying vec2 vUv; uniform float uTime; void main(){ float a = sin((vUv.y+uTime*0.5)*8.0)*0.5+0.5; a *= 0.22; float edge = smoothstep(0.0,0.15,vUv.y)*smoothstep(1.0,0.75,vUv.y); a*=edge; if(a<0.01) discard; vec3 col = mix(vec3(1.0,0.55,0.15), vec3(1.0,0.85,0.4), vUv.y); gl_FragColor=vec4(col,a*0.55); }`
      });
      heatHaze = new (THREE as any).Mesh(heatHazeGeom, heatHazeMat);
  heatHaze.position.copy(flameGroup.position).add(new THREE.Vector3(0,0.7,0));
      heatHaze.rotation.y = Math.PI/6;
      scene.add(heatHaze);
    }

    // Raycaster for highlighting pipelines
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let highlighted: THREE.Mesh | null = null;

    function setHighlight(target: THREE.Mesh | null) {
      if (highlighted && highlighted !== target) {
        const m = highlighted.material as THREE.MeshStandardMaterial;
        m.emissive.setHex(0x000000);
      }
      if (target) {
        const m = target.material as THREE.MeshStandardMaterial;
        m.emissive.setHex(0x18608f);
      }
      highlighted = target;
    }

    // Tooltip element for pipelines
    let pipelineTooltip: HTMLDivElement | null = null;
    if (overlayRef.current) {
      pipelineTooltip = document.createElement('div');
      pipelineTooltip.className = 'pipeline-tooltip';
      pipelineTooltip.style.display = 'none';
      overlayRef.current.appendChild(pipelineTooltip);
    }

    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const objs = pipelines.map(p => p.mesh);
      const hits = raycaster.intersectObjects(objs, false);
      setHighlight(hits.length ? (hits[0].object as THREE.Mesh) : null);
      if (pipelineTooltip) {
        if (hits.length) {
          const idx = objs.indexOf(hits[0].object as THREE.Mesh);
          const type = idx === 0 ? 'Oil' : idx === 1 ? 'Gas' : 'Water';
          const estRate = idx === 0 ? '480 bbl/d' : idx === 1 ? '1.8 MMscf/d' : '120 bbl/d eq';
          pipelineTooltip.innerHTML = `<strong>${type} Line</strong><br/><span>${estRate}</span>`;
          pipelineTooltip.style.display = 'block';
          pipelineTooltip.style.left = `${e.clientX - rect.left + 12}px`;
          pipelineTooltip.style.top = `${e.clientY - rect.top + 12}px`;
        } else {
          pipelineTooltip.style.display = 'none';
        }
      }
    }
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // Click selection
    function onPointerDown(e: PointerEvent) {
      if (!onSelect) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      // Flatten highlightable objects
      const sets = highlightablesRef.current;
      const allMeshes: { mesh: THREE.Object3D; key: string }[] = [];
      sets.forEach(s => s.objects.forEach(o => o.traverse(child => { if ((child as any).isMesh) allMeshes.push({ mesh: child, key: s.key }); })));
      const hits = raycaster.intersectObjects(allMeshes.map(o => o.mesh as THREE.Object3D), false);
      if (hits.length) {
  const hitObj = hits[0].object as THREE.Object3D & { parent?: THREE.Object3D };
  const found = allMeshes.find(o => o.mesh === hitObj || hitObj.parent === o.mesh);
        if (found) onSelect(found.key);
      }
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Animation
    const clock = new THREE.Clock();
    // Label creation
    const overlay = overlayRef.current;
    interface LabelDef { name: string; anchor: THREE.Vector3; el: HTMLSpanElement; }
    const labelDefs: LabelDef[] = [];
    function addLabel(name: string, anchor: THREE.Vector3) {
      if (!overlay) return;
      const span = document.createElement('span');
      span.className = 'three-label';
      span.textContent = name;
      overlay.appendChild(span);
      labelDefs.push({ name, anchor, el: span });
    }
  addLabel('Pumpjack', new THREE.Vector3(0,1.55,0));
  addLabel('Flare', flameGroup.position.clone());
  // Updated separator label height (vessel center at y=0.75 so label slightly above shell)
  addLabel('Separator', new THREE.Vector3(-2.0,1.45,3.2));
  addLabel('Manifold', manifoldGroup.position.clone().add(new THREE.Vector3(0,0.9,0)));
  addLabel('Tanks', new THREE.Vector3(-5.6,1.2,-3.0));
  addLabel('Wellheads', new THREE.Vector3(0.9,0.9,-3.9));
  addLabel('VRU', new THREE.Vector3(-7.2,0.95,-0.6));
  addLabel('KO Drum', new THREE.Vector3(4.0,1.05,-2.2));

    function updateLabels() {
      if (!overlay) return;
      const w = width; const h = height;
      labelDefs.forEach(ld => {
        const projected = ld.anchor.clone().project(camera);
        const visible = projected.z < 1 && projected.z > -1;
        if (!visible) { ld.el.style.display = 'none'; return; }
        ld.el.style.display = 'block';
        const x = (projected.x * 0.5 + 0.5) * w;
        const y = (-projected.y * 0.5 + 0.5) * h;
        ld.el.style.transform = `translate(${x}px, ${y}px)`;
      });
    }

    // Mini legend overlay (inside 3D container)
    if (overlay) {
      const legend = document.createElement('div');
      legend.className = 'three-mini-legend';
      legend.innerHTML = `
        <div class="ttl">Pad Legend</div>
        <ul>
          <li><span class="sw oil"></span>Oil Line</li>
            <li><span class="sw gas"></span>Gas Line</li>
            <li><span class="sw wat"></span>Water Line</li>
            <li><span class="sw flr"></span>Flare</li>
            <li><span class="sw hl"></span>Highlight</li>
        </ul>`;
      overlay.appendChild(legend);
      // Info card container (initially hidden)
      const info = document.createElement('div');
      info.className = 'three-info-card';
      Object.assign(info.style, ({
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        maxWidth: '340px',
        background: 'rgba(10,20,30,0.78)',
        backdropFilter: 'blur(4px)',
        border: '1px solid #264253',
        padding: '10px 12px',
        fontSize: '11px',
        lineHeight: '1.3em',
        color: '#e4edf4',
        borderRadius: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        display: 'none',
        overflowY: 'auto',
        maxHeight: '38%',
        pointerEvents: 'auto',
        WebkitOverflowScrolling: 'touch',
      }) as unknown as CSSStyleDeclaration);
      // Build structured (header + body) layout to support collapse/expand
      info.innerHTML = '';
      const hdrBar = document.createElement('div');
      hdrBar.className = 'info-hdr';
      Object.assign(hdrBar.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px',
        fontWeight: '600',
        fontSize: '12px',
        marginBottom: '6px'
      });
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'Select a component';
      const collapseBtn = document.createElement('button');
      collapseBtn.type = 'button';
      collapseBtn.className = 'collapse-btn';
      Object.assign(collapseBtn.style, {
        background: 'rgba(255,255,255,0.07)',
        color: '#d8e6ef',
        border: '1px solid #345266',
        fontSize: '12px',
        lineHeight: '1',
        width: '22px',
        height: '22px',
        padding: '0',
        cursor: 'pointer',
        borderRadius: '4px'
      });
      collapseBtn.textContent = '−';
      collapseBtn.setAttribute('aria-label', 'Collapse info panel');
      collapseBtn.setAttribute('aria-expanded', 'true');
      hdrBar.appendChild(titleSpan);
      hdrBar.appendChild(collapseBtn);
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'body';
      bodyDiv.innerHTML = '<em>Select a component to learn more.</em>';
      info.appendChild(hdrBar);
      info.appendChild(bodyDiv);
      let collapsed = false;
      function applyCollapseState() {
        if (collapsed) {
          bodyDiv.style.display = 'none';
          info.style.maxHeight = '32px';
          collapseBtn.textContent = '+';
          collapseBtn.setAttribute('aria-label', 'Expand info panel');
          collapseBtn.setAttribute('aria-expanded', 'false');
        } else {
          bodyDiv.style.display = 'block';
            info.style.maxHeight = '38%';
          collapseBtn.textContent = '−';
          collapseBtn.setAttribute('aria-label', 'Collapse info panel');
          collapseBtn.setAttribute('aria-expanded', 'true');
        }
      }
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        collapsed = !collapsed;
        applyCollapseState();
      });
      // Expose simple dataset flags to reuse in population effect
      (info as any).__getParts = () => ({ titleSpan, bodyDiv, collapseBtn });
      applyCollapseState();
      overlay.appendChild(info);
      infoCardRef.current = info;

      // Prevent camera orbit / zoom when interacting with the info card
      const stop = (e: Event) => { e.stopPropagation(); };
      info.addEventListener('wheel', stop, { passive: true }); // allow scroll but block bubbling
      info.addEventListener('pointerdown', stop);
      info.addEventListener('pointermove', stop);
      info.addEventListener('touchstart', stop, { passive: true });
      info.addEventListener('touchmove', stop, { passive: true });
    }

    // Collect highlightable sets
    highlightablesRef.current = [
      { key: 'pumpjack', objects: [pumpjackGroup] },
  { key: 'flare', objects: [flareStack, flameGroup] },
      { key: 'pipelines', objects: pipelines.map(p => p.mesh) },
      { key: 'separator', objects: [separatorGroup] },
  { key: 'manifold', objects: [manifoldGroup] },
      { key: 'tanks', objects: [tanksGroup] },
      { key: 'wellheads', objects: [wellheadGroup] }
    ];
    // Append new components (VRU & KO Drum) to highlight sets
    highlightablesRef.current.push(
      { key: 'vru', objects: [vruGroup] },
      { key: 'kodrum', objects: [koDrumGroup] }
    );

    // highlight handling occurs in separate effect

    // Pumpjack stroke control parameters
    const PUMP_SPM = 8; // strokes per minute (can expose via UI later)
    const pumpAngularVel = (Math.PI * 2 * PUMP_SPM) / 60; // radians per second argument multiplier for sin

    // Gas flare puffs system -------------------------------------------
    interface Puff { mesh: THREE.Mesh; life: number; maxLife: number; v: THREE.Vector3; startScale: number; endScale: number; }
    const puffGroup = new THREE.Group();
    puffGroup.position.copy(flameGroup.position).add(new THREE.Vector3(0, flameHeight * 0.85, 0));
    scene.add(puffGroup);
    const puffs: Puff[] = [];
    const puffGeo = new (THREE as any).PlaneGeometry(1,1,1,1);
    function makePuffMaterial() {
      return new (THREE as any).ShaderMaterial({
        transparent:true, depthWrite:false, blending:(THREE as any).AdditiveBlending ?? 2,
        uniforms:{ uLife:{ value:0 }, uSeed:{ value: Math.random()*1000 } },
        vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader:`varying vec2 vUv; uniform float uLife; uniform float uSeed; void main(){ vec2 c=vUv-0.5; float r=length(c); float soft=1.0-smoothstep(0.0,0.55,r); float edge=smoothstep(0.5,0.15,r); float life=1.0-uLife; float a=soft*edge*life; vec3 col=mix(vec3(0.9,0.6,0.2), vec3(1.0,0.85,0.55), uLife); a*=0.55; if(a<0.02) discard; gl_FragColor=vec4(col,a); }`
      });
    }
    let puffSpawnAccum = 0; // spawn accumulator
    const FLARE_PUFF_THRESHOLD = 14; // MSCF/d example threshold
    const MAX_ACTIVE_PUFFS = 40;

    function spawnPuff(strength: number) {
      if (puffs.length >= MAX_ACTIVE_PUFFS) return;
      const mesh = new (THREE as any).Mesh(puffGeo, makePuffMaterial());
      mesh.scale.setScalar(0.15);
      mesh.position.set(0,0,0);
      const puff: Puff = {
        mesh,
        life: 0,
        maxLife: 0.9 + Math.random()*0.6,
        v: new THREE.Vector3((Math.random()-0.5)*0.15, 0.9 + Math.random()*0.6 + strength*0.05, (Math.random()-0.5)*0.15),
        startScale: 0.15,
        endScale: 0.75 + strength*0.05 + Math.random()*0.15
      };
      puffGroup.add(mesh);
      puffs.push(puff);
    }

    let lastT = 0;
    function animate() {
      const t = clock.getElapsedTime();
      const dt = t - lastT; lastT = t;
      // Pumpjack oscillation controlled by SPM
      const pumpArg = t * pumpAngularVel; // radians progression
      const beamPivotRef: any = (pumpjackGroup as any).userData?.beamPivot;
      const pitL: any = (pumpjackGroup as any).userData?.pitmanArmL;
      const pitR: any = (pumpjackGroup as any).userData?.pitmanArmR;
      const pinCarrier: any = (pumpjackGroup as any).userData?.pinCarrier;
      const polishRodRef: any = (pumpjackGroup as any).userData?.polishRod;
      const horseHeadRef: any = (pumpjackGroup as any).userData?.horseHead;
      const beltRef: any = (pumpjackGroup as any).userData?.belt;
      const stroke = 0.55; // beam end vertical travel scale
      const beamRot = Math.sin(pumpArg) * 0.30; // rocking amplitude
      if (beamPivotRef) beamPivotRef.rotation.z = beamRot;
      // Update crank rotation & eccentric pin position
      crankGroup.rotation.z = pumpArg; // wheel spin
      const eccR = 0.28;
      if (pinCarrier) pinCarrier.position.set(0, Math.sin(pumpArg)*eccR, Math.cos(pumpArg)*0.0);
      // Beam end vertical position drives polish rod
      if (polishRodRef) polishRodRef.position.y = -0.45 + (-Math.sin(pumpArg) * stroke * 0.48);
      if (horseHeadRef) horseHeadRef.rotation.z = Math.sin(pumpArg)*0.05; // slight nodding
      // Pitman arms: rotate to visually connect (simplified pivoting)
      const armBaseY = 0.55; const armTopY = beamPivotRef ? beamPivotRef.position.y - 0.05 + Math.sin(pumpArg)*0.30 : 0.90;
      const armAngle = Math.atan2(armTopY - armBaseY, 0.95); // approximate planar angle
      if (pitL) pitL.rotation.z = armAngle;
      if (pitR) pitR.rotation.z = armAngle;
      // Counterweight bobbing (relative inside crankGroup)
      counterWeight.position.y = 0.20 + Math.sin(pumpArg + Math.PI/2)*0.08;
      // Belt spin (simulate drive)
      if (beltRef && beltRef.rotation) beltRef.rotation.x += dt * 6.0;
  // VRU compressor fan rotation (slow, continuous) – rotate around local Y (disc axis after X tilt)
      try {
        const rv = recoveredVaporRateRef.current || 0; // MSCF/d
        const baseSpeed = 2.5; // rad/sec baseline
        const speed = baseSpeed + Math.min(12, rv) * 0.12; // modest scaling with cap
        fanDisc.rotation.y += dt * speed;
      } catch { /* ignore if fanDisc missing */ }
      // Cooler axial fan rotation (faster & scales stronger with throughput)
      try {
        const rv = recoveredVaporRateRef.current || 0;
        const coolerFan: any = (vruGroup as any).userData?.coolerFan;
        if (coolerFan) {
          const spin = 4.5 + Math.min(18, rv) * 0.28; // higher rpm impression
          coolerFan.rotation.y += dt * spin;
        }
      } catch { /* ignore cooler fan issues */ }
      // Panel indicator lights pulsing (sequential chase when high load)
      try {
        const panelLights: any[] = (vruGroup as any).userData?.panelLights || [];
        const rv = recoveredVaporRateRef.current || 0;
        panelLights.forEach((mesh, idx) => {
          const mat: any = mesh.material; if (!mat) return;
          if (mat.userData.__baseEm === undefined) mat.userData.__baseEm = mat.emissive.getHex?.() ?? 0x003b55;
          // Base color stays; vary emissiveIntensity
          const phase = t*2.0 + idx * 0.9;
          const loadFactor = Math.min(1, rv / 12);
          const pulse = 0.4 + 0.6 * (0.5 + 0.5*Math.sin(phase));
          mat.emissiveIntensity = 0.3 + loadFactor * pulse * 1.2;
          // When high load, briefly flash sequentially
          if (rv > 10) {
            const flash = Math.max(0, Math.sin(phase*3.0));
            mat.emissiveIntensity += flash * 0.4;
          }
        });
      } catch { /* ignore panel light errors */ }
      // VRU compressor body emissive pulsation (simulated load) scales with recovered vapor throughput
      try {
        const compMat: any = (vruComp as any).material;
        if (compMat) {
          if (compMat.userData.__baseEI === undefined) compMat.userData.__baseEI = compMat.emissiveIntensity ?? 0.4;
          const rv = recoveredVaporRateRef.current || 0;
            const amp = Math.min(0.6, 0.18 + rv * 0.02); // amplitude grows with load
          compMat.emissiveIntensity = compMat.userData.__baseEI + amp * (0.5 + 0.5 * Math.sin(t * 5.0 + rv * 0.25));
        }
      } catch { /* ignore emissive modulation errors */ }
  // Flame animation updates (time, billboard facing camera, flicker)
    // Flame materials (billboard + core)
    // Legacy multi-sheet materials removed; only update current uniforms.
  const mainMat: any = (flameGroup as any).userData?.mainFlameMaterial;
  if (mainMat) { try { mainMat.uniforms.uTime.value = t; } catch { /* ignore */ } }
  const coreMatDyn: any = (flameGroup as any).userData?.coreFlameMaterial;
  if (coreMatDyn) { try { coreMatDyn.uniforms.uTime.value = t; } catch { /* ignore */ } }
  const bb: any = (flameGroup as any).userData?.billboard; if (bb) { try { bb.quaternion.copy((camera as any).quaternion); } catch { /* ignore */ } }
  const halo: any = (flameGroup as any).userData?.halo; if (halo) { try { halo.quaternion.copy((camera as any).quaternion); const hm = halo.material; if (hm.uniforms) hm.uniforms.uTime.value = t; } catch { /* ignore */ } }
    // Light flicker (modulate point light similar to flame turbulence)
    (fill as any).intensity = baseFillIntensity * (1.0 + 0.25*Math.sin(t*15.0) + 0.15*Math.sin(t*7.3 + 1.0) + 0.08*Math.sin(t*23.7));
      // Flare gas puffs emission
      const currentRate = flareRateRef.current;
      if (currentRate > FLARE_PUFF_THRESHOLD) {
        const excess = currentRate - FLARE_PUFF_THRESHOLD;
        // spawn rate scales with excess; base ~4 puffs/sec at threshold+1
        const spawnRate = 2 + excess * 0.35; // puffs per second
        puffSpawnAccum += dt * spawnRate;
        while (puffSpawnAccum > 1) {
          spawnPuff(excess);
          puffSpawnAccum -= 1;
        }
      }
      // Update existing puffs
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.life += dt;
        const lf = p.maxLife > 0 ? p.life / p.maxLife : 1;
        if (lf >= 1) {
          const parentObj = (p.mesh as any).parent; if (parentObj) parentObj.remove(p.mesh);
          const matDispose: any = (p.mesh as any).material; if (matDispose?.dispose) matDispose.dispose();
          puffs.splice(i,1);
          continue;
        }
        // position update (manual scaled add)
        p.mesh.position.x += p.v.x * dt;
        p.mesh.position.y += p.v.y * dt;
        p.mesh.position.z += p.v.z * dt;
        const sc = p.startScale + (p.endScale - p.startScale) * lf;
        p.mesh.scale.set(sc, sc, sc);
        const mat: any = (p.mesh as any).material; if (mat?.uniforms) mat.uniforms.uLife.value = lf;
        // face camera
        try { (p.mesh as any).quaternion.copy((camera as any).quaternion); } catch { /* ignore */ }
      }
      // pipeline flows
      pipelines.forEach(p => {
        p.flows.forEach(f => {
          f.progress = (f.progress + f.speed * 0.016) % 1;
          const pos = p.curve.getPointAt(f.progress);
            f.marker.position.copy(pos);
        });
      });
      // Animate tank internal bulk fluid levels (placeholder dynamics until wired to real metric)
      tankGroups.forEach(g => {
        const bulk: any = (g as any).userData.bulkFluid;
        if (bulk) {
          const baseF = (g as any).userData.fluidLevel ?? 0.6;
          const target = baseF * (0.9 + 0.1*Math.sin(t*0.25 + g.position.x));
          // Lerp current scale.y toward target height fraction (use initial scale.y as proxy for full height if first frame)
          const fullRef = (g as any).userData.fullFluidScale || ((g as any).userData.fullFluidScale = bulk.scale.y / ( (g as any).userData.fluidLevel || 1));
          const desired = target * fullRef;
          bulk.scale.y += (desired - bulk.scale.y) * 0.07;
          bulk.position.y = bulk.scale.y/2; // base anchored at y=0
        }
      });
      if (realismEnabled) {
        if (ENABLE_FLARE_GLOW) {
          flareGlowPlanes.forEach((gp,i)=> {
            const dyn = gp.base + Math.sin(t*3.5 + i)*0.08 + Math.sin(t*7.0 + i)*0.04;
              gp.mesh.scale.set(dyn,dyn,dyn);
              try { (gp.mesh as any).quaternion.copy((camera as any).quaternion); } catch { /* ignore */ }
              const mat = gp.mesh.material as any;
              mat.opacity = gp.baseOpacity + Math.sin(t*4 + i)*0.05;
          });
        }
        if (heatHazeMat) heatHazeMat.uniforms.uTime.value = t;
        if ((scene as any).fog) {
          (scene as any).fog.density = 0.058 + Math.sin(t*0.15)*0.0025;
        }
      }
      // (Gas shimmer animation removed – particles disabled)
      // (Removed manual camera orbit to allow OrbitControls (wheel zoom, user orbit) full control.)
  controls.update();
  renderer.render(scene, camera);
      updateLabels();
      requestRef.current = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', handleResize);

  return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
  renderer.domElement.removeEventListener('pointermove', onPointerMove);
  renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      el.removeChild(renderer.domElement);
      // Dispose resources
      pipelineGroup.children.forEach((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (infoCardRef.current) infoCardRef.current.style.display = 'none';
  const mat = mesh.material as any;
  if (Array.isArray(mat)) mat.forEach(m => m.dispose && m.dispose()); else if (mat && mat.dispose) mat.dispose();
      });
  [ground, flareStack, base, beam, horseHead, polishRod].forEach(m => { if ((m as any)?.geometry) (m as any).geometry.dispose?.(); });
  const mm: any = (flameGroup as any).userData?.mainFlameMaterial; if (mm?.dispose) mm.dispose();
  const cm: any = (flameGroup as any).userData?.coreFlameMaterial; if (cm?.dispose) cm.dispose();
  const bbDisp: any = (flameGroup as any).userData?.billboard; if (bbDisp?.geometry) bbDisp.geometry.dispose();
  if (coreMesh?.geometry) coreMesh.geometry.dispose();
  const haloD: any = (flameGroup as any).userData?.halo; if (haloD){ if (haloD.geometry) haloD.geometry.dispose(); const hm = haloD.material; if (hm?.dispose) hm.dispose(); }
    if (gasGeo) gasGeo.dispose();
      // Dispose added realism assets
      if (ENABLE_FLARE_GLOW) {
        flareGlowPlanes.forEach(gp => {
          if (gp.mesh.geometry) gp.mesh.geometry.dispose();
          const mat = gp.mesh.material as any; if (mat && mat.dispose) mat.dispose();
        });
      }
  if (heatHazeGeom) heatHazeGeom.dispose(); if (heatHazeMat) heatHazeMat.dispose();
  // Dispose puff system
  puffs.forEach(p => { const parentObj = (p.mesh as any).parent; if (parentObj) parentObj.remove(p.mesh); if ((p.mesh as any).material?.dispose) (p.mesh as any).material.dispose(); });
  puffGeo.dispose();
      if (overlay) overlay.innerHTML = '';
      renderer.dispose();
    };

    // Expose capture API
    if (typeof onReady === 'function') {
      try { (onReady as (api:{capture:()=>string})=>void)({ capture: () => renderer.domElement.toDataURL('image/png') }); } catch { /* noop */ }
    }


    // Attempt high-fidelity GLTF asset loading (non-blocking)
    const gltfLoader = new GLTFLoader();
    interface GLSpec { key: string; url: string; attach: () => THREE.Group }
    const specs: GLSpec[] = [
      { key: 'pumpjack', url: '/assets/gltf/pumpjack.glb', attach: () => pumpjackGroup },
      { key: 'separator', url: '/assets/gltf/separator.glb', attach: () => separatorGroup },
      { key: 'tanks', url: '/assets/gltf/tanks.glb', attach: () => tanksGroup },
      { key: 'flare', url: '/assets/gltf/flare.glb', attach: () => { const g = new THREE.Group(); g.position.copy(flareStack.position); scene.add(g); return g; } },
      { key: 'wellheads', url: '/assets/gltf/wellheads.glb', attach: () => wellheadGroup },
  { key: 'manifold', url: '/assets/gltf/manifold.glb', attach: () => { const g = new THREE.Group(); g.position.copy(manifoldGroup.position); scene.add(g); return g; } }
    ];
    specs.forEach(spec => {
      gltfLoader.load(spec.url, (gltf: any) => {
        const root = gltf.scene as THREE.Group;
        root.traverse(obj => {
          if ((obj as any).isMesh) {
            const mat = (obj as THREE.Mesh).material as any;
            if (mat && mat.metalness !== undefined) {
              mat.metalness = Math.min(0.85, (mat.metalness ?? 0.5) * 1.05);
              mat.roughness = Math.max(0.18, (mat.roughness ?? 0.5) * 0.92);
            }
            if (realismEnabled) { (obj as any).castShadow = true; (obj as any).receiveShadow = true; }
          }
        });
        spec.attach().add(root);
      }, undefined, () => {/* ignore missing asset */});
    });

    // Environment HDR (if present). Place file at /assets/env/industrial.hdr
    if (realismEnabled) {
      const rgbe = new RGBELoader();
      rgbe.load('/assets/env/industrial.hdr', (tex: any) => {
        tex.mapping = (THREE as any).EquirectangularReflectionMapping;
        (scene as any).environment = tex;
        // Comment out next line to retain solid background color instead of HDR
        scene.background = tex;
      });
    }

    // Runtime toggle button (affects dynamic effects only)
    if (overlayRef.current) {
      const overlayEl = overlayRef.current;
      const toggle = document.createElement('button');
      toggle.className = 'realism-toggle';
      toggle.textContent = realismEnabled ? 'Realism: ON' : 'Realism: OFF';
      Object.assign(toggle.style, { position:'absolute', top:'8px', right:'8px', zIndex:'12', padding:'4px 8px', background:'rgba(0,0,0,0.45)', color:'#eee', border:'1px solid #555', fontSize:'11px', cursor:'pointer', borderRadius:'4px' });
      toggle.addEventListener('click', () => {
        realismEnabled = !realismEnabled;
        toggle.textContent = realismEnabled ? 'Realism: ON' : 'Realism: OFF';
        console.warn('Realism toggle changed. Full reload recommended for shadow/env changes; dynamic glow/haze animate only when ON.');
      });
  (overlayEl as HTMLDivElement).appendChild(toggle);
      // Flame tuning panel (if flame shaders present)
      try {
        const flameMatRef: any = (flameGroup as any).userData?.mainFlameMaterial;
        const coreMatRef: any = (flameGroup as any).userData?.coreFlameMaterial;
        const haloMatRef: any = (flameGroup as any).userData?.halo?.material;
  if (flameMatRef && !(overlayEl as HTMLDivElement).querySelector('.flame-controls')) {
          const panel = document.createElement('div');
          panel.className = 'flame-controls';
          Object.assign(panel.style, { position:'absolute', top:'40px', right:'8px', padding:'6px 8px', background:'rgba(8,16,24,0.65)', border:'1px solid #24404f', borderRadius:'6px', width:'170px', color:'#cfe3ec', fontSize:'11px', lineHeight:'1.2em', zIndex:'12', backdropFilter:'blur(4px)' });
          panel.innerHTML = `
            <div style="font-weight:600; margin-bottom:4px;">Flame Tuning</div>
            <label style="display:block;margin:4px 0;">Intensity <input type="range" min="0.4" max="2.0" step="0.01" value="1" data-key="intensity" /></label>
            <label style="display:block;margin:4px 0;">Turbulence <input type="range" min="0.5" max="2.0" step="0.01" value="1" data-key="turb" /></label>
            <label style="display:block;margin:4px 0;">Size <input type="range" min="0.7" max="1.6" step="0.01" value="1" data-key="size" /></label>
            <label style="display:block;margin:4px 0;">Color Bias <input type="range" min="-1" max="1" step="0.01" value="0" data-key="bias" /></label>
            <label style="display:block;margin:4px 0;">Lick/Tongues <input type="range" min="0" max="2" step="0.01" value="0.9" data-key="lick" /></label>
          `;
          panel.querySelectorAll('input[type=range]').forEach(inp => {
            inp.addEventListener('input', () => {
              const key = (inp as HTMLInputElement).dataset.key; const val = parseFloat((inp as HTMLInputElement).value);
              if (key === 'intensity' && flameMatRef.uniforms.uIntensity) { flameMatRef.uniforms.uIntensity.value = val; if (coreMatRef?.uniforms?.uIntensity) coreMatRef.uniforms.uIntensity.value = val; if (haloMatRef?.uniforms?.uIntensity) haloMatRef.uniforms.uIntensity.value = Math.min(1.8, val*1.1); }
              if (key === 'turb' && flameMatRef.uniforms.uTurbBoost) { flameMatRef.uniforms.uTurbBoost.value = val; }
              if (key === 'size' && flameMatRef.uniforms.uSize) { flameMatRef.uniforms.uSize.value = val; }
              if (key === 'bias') { if (flameMatRef.uniforms.uColorBias) flameMatRef.uniforms.uColorBias.value = val; if (coreMatRef?.uniforms?.uColorBias) coreMatRef.uniforms.uColorBias.value = val; }
              if (key === 'lick' && flameMatRef.uniforms.uLick) { flameMatRef.uniforms.uLick.value = val; }
            });
          });
          (overlayEl as HTMLDivElement).appendChild(panel);
          (flameGroup as any).userData.controlPanel = panel;
        }
      } catch { /* ignore panel errors */ }
    }
  // Intentionally exclude brightness from deps: initial brightness applied; runtime changes handled in separate effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // scene init only (callbacks captured once to avoid reinit resetting camera/zoom)

  // Live flare rate updates (no scene re-init)
  useEffect(() => { flareRateRef.current = flareRate; }, [flareRate]);
  useEffect(() => { recoveredVaporRateRef.current = recoveredVaporRate; }, [recoveredVaporRate]);

  // Brightness live adjustment without full reinit
  useEffect(() => {
    const r = rendererRef.current as any;
    if (r) {
      if (r.toneMappingExposure !== undefined) r.toneMappingExposure = 1.15 * brightness;
    }
    const { hemi, key, rim, fill } = lightRefs.current;
    if (hemi) (hemi as any).intensity = 0.7 * brightness;
    if (key) (key as any).intensity = 1.25 * brightness;
    if (rim) (rim as any).intensity = 0.55 * brightness;
    if (fill) (fill as any).intensity = 1.35 * brightness; // base flicker scales from this
  }, [brightness]);

  // Focus effect on prop change
  useEffect(() => {
    type EmissiveUserData = { __origEmissive?: number; __origIntensity?: number };
    const sets = highlightablesRef.current;
    if (!sets.length) return;
    // reset
    sets.forEach(set => set.objects.forEach(obj => obj.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        const mats: any[] = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            const ud = mat.userData as EmissiveUserData;
            if (ud.__origEmissive !== undefined) {
              mat.emissive.setHex(ud.__origEmissive);
              if (ud.__origIntensity !== undefined) {
                (mat as unknown as { emissiveIntensity?: number }).emissiveIntensity = ud.__origIntensity;
              }
            }
          }
        });
      }
    })));
    if (!focus) return;
    const target = sets.find(s => s.key === focus);
    if (!target) return;
    // Outline + camera & controls tween (aggregate bounds of all objects in set)
    try {
      const cam = cameraRef.current as THREE.PerspectiveCamera | null;
      const controls = (controlsRef as any).current;
      if (cam && target.objects.length) {
        const box = new THREE.Box3();
        // Expand by every object (some sets contain multiple disjoint meshes e.g., pipelines)
        target.objects.forEach(o => box.expandByObject(o));
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        // Derive an effective radius using max dimension
        const maxDim = Math.max(size.x, size.y, size.z);
        // Fallback if object has zero size (e.g., proxy)
        const safeDim = maxDim > 0.0001 ? maxDim : 1.5;
        // Compute required distance from center so object fits in vertical FOV (add padding)
        const fovRad = (cam.fov * Math.PI) / 180;
        let distance = (safeDim * 0.5) / Math.tan(fovRad / 2);
        distance *= 1.35; // padding factor
        // Preserve current orbit azimuth / polar if controls exist for consistent user mental model
        let targetPos: THREE.Vector3;
        if (controls && controls.target) {
          const currentOffset = cam.position.clone().sub(controls.target.clone());
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(currentOffset);
            spherical.radius = THREE.MathUtils.clamp(distance, 2, 60);
            // Manual spherical -> Cartesian to avoid optional method typing issues
            const sinPhi = Math.sin(spherical.phi);
            const newOffset = new THREE.Vector3(
              spherical.radius * sinPhi * Math.cos(spherical.theta),
              spherical.radius * Math.cos(spherical.phi),
              spherical.radius * sinPhi * Math.sin(spherical.theta)
            );
            targetPos = center.clone().add(newOffset);
        } else {
          // Fallback: move back along existing camera->center direction
          const dir = cam.position.clone().sub(center).normalize();
          targetPos = center.clone().add(dir.multiplyScalar(distance));
        }
        // Animate camera position & controls target simultaneously
        gsap.to(cam.position, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 0.95, ease: 'power3.inOut', onUpdate: () => controls?.update() });
        if (controls) {
          gsap.to(controls.target, { x:center.x, y:center.y, z:center.z, duration:0.95, ease:'power3.inOut', onUpdate: () => controls.update() });
        }
        if (outlinePassRef.current) outlinePassRef.current.selectedObjects = target.objects;
      }
    } catch { /* ignore focus tween errors */ }
    target.objects.forEach(obj => obj.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        const mats: any[] = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            const ud = mat.userData as EmissiveUserData;
            if (ud.__origEmissive === undefined) {
              ud.__origEmissive = mat.emissive.getHex?.() ?? 0x000000;
              ud.__origIntensity = (mat as unknown as { emissiveIntensity?: number }).emissiveIntensity ?? 1;
            }
            mat.emissive.setHex(0x1d86d5);
            (mat as unknown as { emissiveIntensity?: number }).emissiveIntensity = 1.2;
          }
        });
      }
    }));
  }, [focus]);

  // Info card population
  useEffect(() => {
    const card = infoCardRef.current;
    if (!card) return;
    const parts = (card as any).__getParts ? (card as any).__getParts() : null;
    if (!parts) return;
    const { titleSpan, bodyDiv } = parts as { titleSpan: HTMLSpanElement; bodyDiv: HTMLDivElement };
    if (!focus) { card.style.display = 'none'; return; }
    const data = COMPONENT_KNOWLEDGE[focus];
    if (!data) { card.style.display = 'none'; return; }
    const list = (label: string, items?: string[]) => (items && items.length ? `<div class="sec"><strong>${label}:</strong><ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>` : '');
    const quiz = data.quiz && data.quiz.length ? `<details class="quiz"><summary>Quick Check</summary><ul>${data.quiz.map((q: { q: string; a: string })=>`<li><strong>Q:</strong> ${q.q}<br/><span class="ans"><strong>A:</strong> ${q.a}</span></li>`).join('')}</ul></details>` : '';
    titleSpan.textContent = data.title;
    bodyDiv.innerHTML = `
      <div class="role">${data.role}</div>
      ${list('Core Functions', data.coreFunctions)}
      ${list('Key Concepts', data.keyConcepts)}
      ${list('Safety Focus', data.safety)}
      ${list('Monitoring Signals', data.monitoring)}
      ${quiz}
      <div class="srcnote">Educational summary – paraphrased industry concepts.</div>
    `;
    card.style.display = 'block';
  }, [focus]);

  return (
    <div className="three-dashboard" ref={containerRef} aria-label="Oil & gas operations visualization">
      <div ref={overlayRef} className="three-overlay" aria-hidden="true" />
    </div>
  );
}
