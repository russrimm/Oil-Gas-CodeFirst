/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface DrillingRigSceneProps {
	focus?: string | null;
	onSelect?: (key: string) => void;
	onReady?: (api: { capture: () => string }) => void;
	brightness?: number;
}

// Knowledge base (concise educational summaries – paraphrased)
interface KBEntry { title: string; role: string; bullets: string[]; quiz?: { q: string; a: string }[] }
const KB: Record<string, KBEntry> = {
	derrick: {
		title: 'Derrick / Mast',
		role: 'Tall lattice structure providing vertical clearance for handling stands of drill pipe.',
		bullets: [ 'Supports crown block & traveling block', 'Enables racking of drill pipe stands', 'Provides hoisting height for tripping operations' ],
		quiz: [{ q: 'Name the stationary sheave set at the top.', a: 'Crown block.' }]
	},
	travelingblock: {
		title: 'Traveling Block & Hook',
		role: 'Moving sheave assembly converting drawworks drum motion into vertical hoist of the drill string via wireline.',
		bullets: [ 'Suspends top drive / hook & elevator', 'Part of block & tackle reducing load', 'Position affects Weight on Bit adjustments' ]
	},
	drillstring: {
		title: 'Drill String / Kelly Stand-in',
		role: 'Pipe assembly transmitting rotation & weight to the bit while circulating drilling fluid.',
		bullets: [ 'Transmits torque & WOB', 'Returns cuttings via annulus', 'Sections added/removed during tripping' ],
		quiz: [{ q: 'What is WOB?', a: 'Weight On Bit – axial force applied at the bit.' }]
	},
	mudpumps: {
		title: 'Mud Pumps (Duplex/Triplex Representation)',
		role: 'Circulate drilling fluid down the drill string & back up the annulus carrying cuttings.',
		bullets: [ 'Provide hydraulic horsepower', 'Enable ECD & pressure control', 'Filter & cool bit / BHA components' ]
	},
	bop: {
		title: 'BOP Stack (Simplified)',
		role: 'Pressure control barrier to seal, shear, or divert well flow during kicks.',
		bullets: [ 'Annular preventer (upper)', 'Pipe / shear rams (lower)', 'Critical to well control safety' ],
		quiz: [{ q: 'What does a shear ram do?', a: 'Cuts the drill pipe and seals the wellbore.' }]
	}
};

export function DrillingRigScene({ focus = null, onSelect, onReady, brightness = 1.0 }: DrillingRigSceneProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const requestRef = useRef<number | null>(null);
	const overlayRef = useRef<HTMLDivElement | null>(null);
	const infoCardRef = useRef<HTMLDivElement | null>(null);
	const highlightSetsRef = useRef<{ key: string; group: THREE.Group }[]>([]);
	const lightRefs = useRef<{ hemi?: THREE.HemisphereLight; key?: THREE.DirectionalLight } >({});
	const onSelectRef = useRef(onSelect);
	const onReadyRef = useRef(onReady);
	useEffect(()=> { onSelectRef.current = onSelect; }, [onSelect]);
	useEffect(()=> { onReadyRef.current = onReady; }, [onReady]);

	// Track traveling block vertical animation state
		// (animation state consolidated into local clock usage – no separate ref needed)

	// Apply focus highlight effect
		useEffect(() => {
		const sets = highlightSetsRef.current;
		// Reset emissive
		sets.forEach(s => s.group.traverse((o: any) => {
			if (o.isMesh && o.material && o.material.emissive) {
				const m = o.material as THREE.MeshStandardMaterial & { userData: any };
				if (m.userData.__origE !== undefined) {
					m.emissive.setHex(m.userData.__origE);
					if (m.userData.__origEI !== undefined) (m as any).emissiveIntensity = m.userData.__origEI;
				}
			}
		}));
			if (focus) {
				const target = sets.find(s => s.key === focus);
				if (target) {
					target.group.traverse((o: any) => {
						if (o.isMesh && o.material && o.material.emissive) {
							const m = o.material as THREE.MeshStandardMaterial & { userData: any };
							if (m.userData.__origE === undefined) {
								m.userData.__origE = m.emissive.getHex?.() ?? 0x000000;
								m.userData.__origEI = (m as any).emissiveIntensity ?? 1;
							}
							m.emissive.setHex(0x1679c2);
							(m as any).emissiveIntensity = 1.2;
						}
					});
				}
			}
			// Update info card for external focus changes
			if (infoCardRef.current) {
				const card = infoCardRef.current;
				if (!focus) {
					card.style.display = 'none';
				} else {
					const data = KB[focus];
					if (data) {
						card.innerHTML = `<strong style="font-size:12px;">${data.title}</strong><div style="margin:4px 0 6px;">${data.role}</div><ul>${data.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>${data.quiz?`<details style="margin-top:6px;"><summary>Quick Check</summary>${data.quiz.map(q=>`<div style='margin:4px 0'><strong>Q:</strong> ${q.q}<br/><strong>A:</strong> ${q.a}</div>`).join('')}</details>`:''}<div style="margin-top:6px;font-size:10px;opacity:.65;">Educational summary – paraphrased.</div>`;
						card.style.display = 'block';
					} else {
						card.style.display = 'none';
					}
				}
			}
	}, [focus]);

		useEffect(() => {
		const el = containerRef.current; if (!el) return;
		const width = el.clientWidth; const height = el.clientHeight;
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#08131c');
		scene.fog = new THREE.FogExp2('#08131c', 0.055);
		const camera = new THREE.PerspectiveCamera(55, width/height, 0.1, 250);
		camera.position.set(10, 6.5, 10.5);
		camera.lookAt(0,3,0);
		const renderer = new THREE.WebGLRenderer({ antialias:true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(width, height);
		// Basic tone mapping & color space
		(renderer as any).outputColorSpace = THREE.SRGBColorSpace;
		(renderer as any).toneMapping = (THREE as any).ACESFilmicToneMapping;
		(renderer as any).toneMappingExposure = 1.15 * brightness;
		// Shadow pipeline (first fidelity upgrade)
		try {
			(renderer as any).shadowMap.enabled = true;
			(renderer as any).shadowMap.type = (THREE as any).PCFSoftShadowMap;
		} catch { /* noop if unavailable in minimal shim */ }
		rendererRef.current = renderer;
		el.appendChild(renderer.domElement);
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true; controls.dampingFactor = 0.08;
		controls.target.set(0,3,0); controls.update();
		// Lights
		const hemi = new THREE.HemisphereLight(0x8fb9ff, 0x132027, 0.65 * brightness); scene.add(hemi);
		const key = new THREE.DirectionalLight(0xffdfc5, 1.25 * brightness); key.position.set(10,14,8);
		// Configure shadow camera (directional) if available
		try {
			(key as any).castShadow = true;
			(key as any).shadow.mapSize.width = 2048;
			(key as any).shadow.mapSize.height = 2048;
			(key as any).shadow.camera.near = 1;
			(key as any).shadow.camera.far = 60;
			(key as any).shadow.camera.left = -25;
			(key as any).shadow.camera.right = 25;
			(key as any).shadow.camera.top = 25;
			(key as any).shadow.camera.bottom = -25;
			(key as any).shadow.bias = -0.00015;
		} catch { /* ignore in shim */ }
		scene.add(key);
		lightRefs.current = { hemi, key };

		// Ground / pad
		// Ground: approximate circle using a many-sided cylinder top face (CircleGeometry not in local type shim)
		const ground = new THREE.Mesh(new (THREE as any).CylinderGeometry(18,18,0.05,96,1), new THREE.MeshStandardMaterial({ color:0x18242c, roughness:0.95, metalness:0.05 }));
		ground.position.y = -0.025; scene.add(ground);
		(ground as any).receiveShadow = true;

		// Substructure & drill floor
		const substructure = new THREE.Group();
		const subMat = new THREE.MeshStandardMaterial({ color:0x2a3a44, metalness:0.35, roughness:0.7, emissive:0x0c1418, emissiveIntensity:0.25 });
		const floor = new THREE.Mesh(new THREE.BoxGeometry(8,0.4,8), subMat.clone()); floor.position.y = 2; substructure.add(floor);
		// Support legs
		for (let i=0;i<4;i++) {
			const leg = new THREE.Mesh(new THREE.BoxGeometry(1,2,1), subMat.clone());
			leg.position.set((i<2?-1:1)*3.2,1,(i%2?-1:1)*3.2);
			substructure.add(leg);
		}
		substructure.position.set(0,0,0); scene.add(substructure);

		// Derrick lattice tower
		const derrick = new THREE.Group();
		const derrickMat = new THREE.MeshStandardMaterial({ color:0x5f6f78, metalness:0.55, roughness:0.4, emissive:0x0e1417, emissiveIntensity:0.22 });
		const derrickHeight = 18; const base = 6; const top = 2.2;
		// Corner legs (tapered using scaled boxes)
		for (let i=0;i<4;i++) {
			const legGeo = new THREE.BoxGeometry(0.6, derrickHeight, 0.6);
			const leg = new THREE.Mesh(legGeo, derrickMat.clone());
			const sx = (i<2?-1:1)*base/2; const sz = (i%2?-1:1)*base/2;
			leg.position.set(sx, derrickHeight/2 + 2.2, sz);
			// slight inward at top by rotating & using child for scaling illusions
			leg.scale.x = leg.scale.z = 1; // uniform
			derrick.add(leg);
		}
		// Horizontal braces every few meters
		const braceMat = new THREE.MeshStandardMaterial({ color:0x6d808a, metalness:0.5, roughness:0.45 });
		const levels = 9;
		for (let l=0;l<=levels;l++) {
			const y = 2.2 + (derrickHeight/levels)*l;
			const scale = (base + (top - base) * (l/levels));
			const half = scale/2;
			const thickness = 0.30;
			// X braces
			const bx = new THREE.Mesh(new THREE.BoxGeometry(scale,0.25,thickness), braceMat.clone()); bx.position.set(0,y,half); derrick.add(bx);
			const bx2 = new THREE.Mesh(new THREE.BoxGeometry(scale,0.25,thickness), braceMat.clone()); bx2.position.set(0,y,-half); derrick.add(bx2);
			// Z braces
			const bz = new THREE.Mesh(new THREE.BoxGeometry(thickness,0.25,scale), braceMat.clone()); bz.position.set(half,y,0); derrick.add(bz);
			const bz2 = new THREE.Mesh(new THREE.BoxGeometry(thickness,0.25,scale), braceMat.clone()); bz2.position.set(-half,y,0); derrick.add(bz2);
			// Simple cross members (diagonals simplified by slender boxes)
			if (l < levels) {
			const diag = new THREE.Mesh(new THREE.BoxGeometry(0.18, (derrickHeight/levels), 0.18), braceMat.clone());
			diag.position.set(half, y + (derrickHeight/levels)/2, half);
				diag.rotation.z = Math.PI/8; derrick.add(diag);
			}
		}
		derrick.position.y = 0; scene.add(derrick);

		// Traveling block & hook (oscillating up/down)
		const travelingBlock = new THREE.Group();
		const blockBody = new THREE.Mesh(new THREE.BoxGeometry(1.2,1.8,1.2), new THREE.MeshStandardMaterial({ color:0xc8d2d8, metalness:0.5, roughness:0.35, emissive:0x111b1f, emissiveIntensity:0.42 }));
		blockBody.position.y = 0.9; travelingBlock.add(blockBody);
		const hook = new THREE.Mesh(new (THREE as any).TorusGeometry(0.45,0.15,14,40), new THREE.MeshStandardMaterial({ color:0xd9b24d, metalness:0.6, roughness:0.4, emissive:0x4a3300, emissiveIntensity:0.55 }));
		hook.rotation.x = Math.PI/2; hook.position.y = -0.4; travelingBlock.add(hook);
		travelingBlock.position.set(0, 14, 0);
		scene.add(travelingBlock);

		// Drill string (simple cylinder) & rotary table / kelly representation
		const rotaryTable = new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,0.4,64), new THREE.MeshStandardMaterial({ color:0x3b4a53, metalness:0.55, roughness:0.45, emissive:0x10181c, emissiveIntensity:0.4 }));
		rotaryTable.position.y = 2.4; scene.add(rotaryTable);
		const kelly = new THREE.Mesh(new THREE.BoxGeometry(0.55,5,0.55), new THREE.MeshStandardMaterial({ color:0x4e93b0, metalness:0.55, roughness:0.4, emissive:0x0a3242, emissiveIntensity:0.6 }));
		kelly.position.y = 2.4 + 2.5; scene.add(kelly);
		const drillString = new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,30,40), new THREE.MeshStandardMaterial({ color:0x6d7d88, metalness:0.5, roughness:0.42, emissive:0x0d1418, emissiveIntensity:0.22 }));
		drillString.position.y = -13 + 2.4; scene.add(drillString);

		// Mud pumps (two reciprocating blocks with animated plungers)
		const mudPumpGroup = new THREE.Group();
		for (let p=0;p<2;p++) {
			const pump = new THREE.Group();
			const body = new THREE.Mesh(new THREE.BoxGeometry(4,1.6,1.6), new THREE.MeshStandardMaterial({ color:0x2c3d46, metalness:0.4, roughness:0.7, emissive:0x0c1418, emissiveIntensity:0.25 }));
			body.position.set(0,0.8,0); pump.add(body);
			for (let cyl=0;cyl<3;cyl++) {
				const cylBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,1.4,28), new THREE.MeshStandardMaterial({ color:0x4d5f69, metalness:0.5, roughness:0.45 }));
				cylBody.rotation.z = Math.PI/2; cylBody.position.set(-1.6 + cyl*1.2, 1.15, 1.2);
				pump.add(cylBody);
				const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.9,28), new THREE.MeshStandardMaterial({ color:0x9dafb8, metalness:0.55, roughness:0.35 }));
				plunger.rotation.z = Math.PI/2; plunger.position.set(-1.6 + cyl*1.2, 1.15, 1.2 + 0.65);
				(plunger as any).userData.phase = cyl / 3 + p*0.2;
				pump.add(plunger);
			}
			pump.position.set(-10,0,p? -3.2:3.2);
			mudPumpGroup.add(pump);
		}
		scene.add(mudPumpGroup);

		// Simplified BOP stack at center below floor
		const bopStack = new THREE.Group();
		const bopMat = new THREE.MeshStandardMaterial({ color:0x9b2c2c, metalness:0.55, roughness:0.45, emissive:0x310a0a, emissiveIntensity:0.48 });
		const bopSections = [1.0,0.8,0.9];
		let bopYAcc = 1.0;
		bopSections.forEach((h) => {
			const sec = new THREE.Mesh(new THREE.BoxGeometry(1.8,h,1.8), bopMat.clone());
			sec.position.y = bopYAcc + h/2 - 0.4;
			bopYAcc += h;
			bopStack.add(sec);
		});
		bopStack.position.y = 0.2;
		scene.add(bopStack);

		// Mark primary geometry for shadow casting / receiving
		const shadowCasters: any[] = [derrick, travelingBlock, drillString, mudPumpGroup, bopStack, substructure, rotaryTable, kelly];
		shadowCasters.forEach(g => g.traverse?.((o: any) => { if (o.isMesh) { (o as any).castShadow = true; (o as any).receiveShadow = true; }}));
		(floor as any).receiveShadow = true;
		// Highlight sets
		highlightSetsRef.current = [
			{ key: 'derrick', group: derrick },
			{ key: 'travelingblock', group: travelingBlock },
			{ key: 'drillstring', group: drillString },
			{ key: 'mudpumps', group: mudPumpGroup },
			{ key: 'bop', group: bopStack },
		];

		// Overlay labels
		const overlay = overlayRef.current;
		interface Label { key: string; anchor: THREE.Object3D; el: HTMLSpanElement }
		const labels: Label[] = [];
		function addLabel(key: string, anchor: THREE.Object3D) {
			if (!overlay) return;
			const span = document.createElement('span');
			span.className = 'three-label';
			span.textContent = key;
			overlay.appendChild(span);
			labels.push({ key, anchor, el: span });
		}
		addLabel('Derrick', derrick);
		addLabel('Block', travelingBlock);
		addLabel('Drill String', drillString);
		addLabel('Mud Pumps', mudPumpGroup);
		addLabel('BOP', bopStack);

		function updateLabels() {
			if (!overlay) return;
			const w = width; const h = height;
			labels.forEach(l => {
				const pos = new THREE.Vector3(); (l.anchor as any).getWorldPosition?.(pos);
				pos.project(camera);
				if (pos.z < 1 && pos.z > -1) {
					l.el.style.display = 'block';
					l.el.style.transform = `translate(${(pos.x*0.5+0.5)*w}px, ${(-pos.y*0.5+0.5)*h}px)`;
				} else l.el.style.display = 'none';
			});
		}

		// Info card
		if (overlay) {
			const card = document.createElement('div');
			card.className = 'three-info-card';
			Object.assign(card.style, { position:'absolute', bottom:'8px', left:'8px', background:'rgba(10,20,30,0.78)', padding:'10px 12px', border:'1px solid #284352', borderRadius:'6px', maxWidth:'340px', fontSize:'11px', lineHeight:'1.25em', color:'#e4edf4', display:'none', pointerEvents:'auto' });
			overlay.appendChild(card); infoCardRef.current = card;
		}

		function populateInfo(keySel: string | null) {
			const card = infoCardRef.current; if (!card) return;
			if (!keySel) { card.style.display='none'; return; }
			const data = KB[keySel as keyof typeof KB];
			if (!data) { card.style.display='none'; return; }
			card.innerHTML = `<strong style="font-size:12px;">${data.title}</strong><div style="margin:4px 0 6px;">${data.role}</div><ul>${data.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>${data.quiz?`<details style="margin-top:6px;"><summary>Quick Check</summary>${data.quiz.map(q=>`<div style='margin:4px 0'><strong>Q:</strong> ${q.q}<br/><strong>A:</strong> ${q.a}</div>`).join('')}</details>`:''}<div style="margin-top:6px;font-size:10px;opacity:.65;">Educational summary – paraphrased.</div>`;
			card.style.display='block';
		}

		// Selection via raycaster
		const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
			function handlePointerDown(e: PointerEvent) {
				if (!onSelectRef.current) return;
			const rect = renderer.domElement.getBoundingClientRect();
			mouse.x = ((e.clientX - rect.left)/rect.width)*2 - 1; mouse.y = -((e.clientY - rect.top)/rect.height)*2 + 1;
			raycaster.setFromCamera(mouse, camera);
			const objs: THREE.Object3D[] = [];
			highlightSetsRef.current.forEach(s => s.group.traverse(o => { if ((o as any).isMesh) objs.push(o); }));
			const hits = raycaster.intersectObjects(objs, false);
			if (hits.length) {
				const h = hits[0].object;
			const found = highlightSetsRef.current.find(s => h === s.group || (h as any).parent === s.group || s.group.children.includes(h));
					if (found) { onSelectRef.current(found.key); populateInfo(found.key); }
			}
		}
		renderer.domElement.addEventListener('pointerdown', handlePointerDown);

		// Initial info if focus preset
		populateInfo(focus);

		// Animation loop
		const clock = new THREE.Clock();
		function animate() {
			const t = clock.getElapsedTime();
			// Traveling block heave (simulate hoisting cycle)
			const cycle = (Math.sin(t*0.35) * 0.5 + 0.5); // 0..1
			const blockRangeTop = 16; const blockRangeBottom = 8.5; // vertical positions relative to floor level 2
			travelingBlock.position.y = 2 + (blockRangeBottom + (blockRangeTop - blockRangeBottom)*cycle);
			// Kelly slow rotation
			kelly.rotation.y = t * 0.35;
			rotaryTable.rotation.y = kelly.rotation.y;
			// Plunger strokes (sinusoidal phase offsets)
			mudPumpGroup.traverse(obj => {
				if ((obj as any).geometry && (obj as any).userData?.phase !== undefined) {
					const phase = (obj as any).userData.phase;
					obj.position.z = 1.2 + Math.sin(t*2.2 + phase*Math.PI*2)*0.25;
				}
			});
			controls.update();
			renderer.render(scene, camera);
			updateLabels();
			requestRef.current = requestAnimationFrame(animate);
		}
		animate();

		function handleResize() {
			if (!containerRef.current) return;
			const w = containerRef.current.clientWidth; const h = containerRef.current.clientHeight;
			camera.aspect = w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
		}
		window.addEventListener('resize', handleResize);

		if (onReadyRef.current) { try { onReadyRef.current({ capture: () => renderer.domElement.toDataURL('image/png') }); } catch { /* ignore */ } }

		return () => {
			if (requestRef.current) cancelAnimationFrame(requestRef.current);
			window.removeEventListener('resize', handleResize);
			renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
			el.removeChild(renderer.domElement);
			scene.traverse(obj => {
				if ((obj as any).isMesh) {
					const mesh = obj as THREE.Mesh; mesh.geometry?.dispose();
					  const m = mesh.material as any; if (m) { if (Array.isArray(m)) { m.forEach(mm=>{ if (mm.dispose) mm.dispose(); }); } else if (m.dispose) { m.dispose(); } }
				}
			});
			renderer.dispose();
			if (overlay) overlay.innerHTML = '';
		};
			// eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time scene initialization; dynamic props handled in separate effects
				}, []); // initialize once – avoid resetting camera/zoom on prop changes

	// Live brightness adjustments
	useEffect(() => {
		const r: any = rendererRef.current; if (r) { if (r.toneMappingExposure !== undefined) r.toneMappingExposure = 1.15 * brightness; }
		const { hemi, key } = lightRefs.current;
		if (hemi) (hemi as any).intensity = 0.65 * brightness;
		if (key) (key as any).intensity = 1.3 * brightness;
	}, [brightness]);

	return (
		<div className="three-dashboard" ref={containerRef} aria-label="Drilling rig visualization">
			<div ref={overlayRef} className="three-overlay" aria-hidden="true" />
		</div>
	);
}

