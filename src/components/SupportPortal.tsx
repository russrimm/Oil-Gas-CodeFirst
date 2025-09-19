import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeDashboard } from './ThreeDashboard';
import { DrillingRigScene } from './DrillingRigScene';
import { AssemblyExplodedScene } from './AssemblyExplodedScene';
import { CopilotChat } from './CopilotChat';
import { staggerIn, pulseMetric } from '../gsapHelpers';
import LifecycleMap from './LifecycleMap.tsx';
import { gsap } from 'gsap';

// Augment window for throttled flare dispatch timestamp
declare global {
  interface Window { __lastFlareDispatch?: number }
}

interface SceneConcept { key: string; label: string; category: string; summary: string; details: string; }

// Production pad concepts
const productionConcepts: SceneConcept[] = [
  {
    key: 'pumpjack',
    label: 'Pumpjack',
    category: 'Lift',
    summary: 'Mechanical beam lift extracting fluid.',
    details: 'The walking beam oscillates about a pivot converting rotary or motor motion into reciprocating lift via the polished rod – drawing fluid to surface in low-pressure reservoirs.'
  },
  {
    key: 'vru',
    label: 'Vapor Recovery Unit',
    category: 'Emissions',
    summary: 'Captures tank vapors for sales instead of flaring.',
    details: 'Small compressor and separator system that draws low-pressure hydrocarbon vapors from tank headspace, compresses and conditions them for routing into the gas line—reducing flare volume and emissions.'
  },
  {
    key: 'wellheads',
    label: 'Wellheads',
    category: 'Production',
    summary: 'Surface termination of wells (“Christmas tree”).',
    details: 'Each wellhead assembly provides pressure control and flow isolation. Multiple wells feed a shared production pad infrastructure to optimize surface footprint.'
  },
  {
    key: 'separator',
    label: 'Separator',
    category: 'Processing',
    summary: 'Horizontal vessel splitting phases.',
    details: 'Three‑phase separator uses residence time and gravity to separate oil, gas and water streams before downstream routing, improving measurement fidelity and equipment protection.'
  },
  {
    key: 'tanks',
    label: 'Storage Tanks',
    category: 'Storage',
    summary: 'Crude and produced water holding.',
    details: 'Tanks provide surge capacity and temporary storage prior to trucking or pipeline export; water tank segregates produced water for disposal or treatment.'
  },
  {
    key: 'manifold',
    label: 'Manifold',
    category: 'Routing',
    summary: 'Flow gathering & distribution block.',
    details: 'Manifold header aggregates flows, enabling isolation, test routing, and distribution to processing or sales lines through valving arrangements.'
  },
  {
    key: 'pipelines',
    label: 'Pipelines',
    category: 'Transport',
    summary: 'Colored surface flow lines.',
    details: 'Lines carry separated phases to storage or measurement; color coding aids operational awareness of content (oil, gas, water).' 
  },
  {
    key: 'flare',
    label: 'Flare Stack',
    category: 'Safety',
    summary: 'Controlled combustion of excess gas.',
    details: 'Intermittently burns off low-volume or upset-condition gas to maintain safe operating pressures while minimizing unplanned releases.'
  },
  {
    key: 'kodrum',
    label: 'Knockout Drum',
    category: 'Safety',
    summary: 'Removes liquids before gas reaches flare.',
    details: 'A low-velocity vessel installed upstream of the flare stack to collect entrained liquids and slugs, preventing liquid carryover that could cause flame instability, smoking, or mechanical damage.'
  }
];

// Drilling rig concepts
const drillingConcepts: SceneConcept[] = [
  { key: 'derrick', label: 'Derrick / Mast', category: 'Hoisting', summary: 'Tall lattice for pipe handling height.', details: 'Provides vertical clearance for stands, supports crown block, and structural stability for hoisting system.' },
  { key: 'travelingblock', label: 'Traveling Block', category: 'Hoisting', summary: 'Moving sheave set lowering & raising string.', details: 'Combines with crown block as block & tackle to translate drawworks drum rotation into vertical travel while multiplying mechanical advantage.' },
  { key: 'drillstring', label: 'Drill String', category: 'Drilling', summary: 'Pipe assembly conveying rotation & fluid.', details: 'Transmits torque & weight-on-bit; drilling fluid pumped down the string returns cuttings up the annulus for solids control.' },
  { key: 'mudpumps', label: 'Mud Pumps', category: 'Circulation', summary: 'High‑pressure positive displacement pumps.', details: 'Provide hydraulic energy to circulate drilling mud, manage equivalent circulating density, cool bit and transport cuttings.' },
  { key: 'bop', label: 'BOP Stack', category: 'Well Control', summary: 'Pressure control barrier system.', details: 'Annular & ram preventers seal around pipe or shear/totally close wellbore to maintain well control during kicks.' }
];

// Lifecycle concepts (Upstream -> Midstream -> Downstream)
const lifecycleConcepts: SceneConcept[] = [
  {
    key: 'upstream',
    label: 'Upstream',
    category: 'Exploration & Production',
    summary: 'Finding and producing hydrocarbons.',
    details: 'Upstream covers geologic surveying, exploration, drilling, completion, and production operations bringing crude oil and natural gas to surface. Activities include seismic acquisition, reservoir evaluation, well construction (drilling & casing), artificial lift, and primary / secondary recovery. Data acquisition and well optimization drive recovery efficiency while managing safety and environmental stewardship.'
  },
  {
    key: 'midstream',
    label: 'Midstream',
    category: 'Gathering & Transport',
    summary: 'Moving and conditioning produced streams.',
    details: 'Midstream gathers produced hydrocarbons, separates / stabilizes, treats impurities, and transports products via pipelines, barges, rail or storage terminals. Typical functions: field gathering systems, gas processing (dehydration, sweetening, NGL recovery), crude / condensate stabilization, compression, fractionation, storage tanks & terminals, and long-haul transportation infrastructure ensuring flow assurance and market connectivity.'
  },
  {
    key: 'downstream',
    label: 'Downstream',
    category: 'Refining & Marketing',
    summary: 'Refining and delivering end products.',
    details: 'Downstream refines crude into products (gasoline, diesel, jet fuel, LPG, petrochemical feedstocks, asphalt) via distillation, conversion (cracking, reforming, alkylation), treating (desulfurization), and blending. It includes product distribution, terminals, retail marketing, lubricants, and petrochemical manufacturing. Focus areas: yield optimization, emissions reduction, product quality, and supply chain logistics.'
  }
];

// Assembly (pump/motor) concepts
const assemblyConcepts: SceneConcept[] = [
  { key: 'baseplate', label: 'Baseplate', category: 'Structure', summary: 'Rigid mounting platform.', details: 'Provides alignment reference and vibration dampening for motor and pump components; ensures shaft concentricity during operation.' },
  { key: 'motor', label: 'Motor', category: 'Driver', summary: 'Rotational power source.', details: 'Electric motor supplying torque via shaft to coupling; speed & power selection matched to hydraulic load of the pump.' },
  { key: 'coupling', label: 'Coupling', category: 'Transmission', summary: 'Connects motor to shaft.', details: 'Flexible mechanical interface accommodating minor misalignment while transmitting torque and reducing vibration transfer.' },
  { key: 'shaft', label: 'Shaft', category: 'Rotation', summary: 'Torque conduit to impeller.', details: 'Transfers rotational energy to the impeller; must resist bending, corrosion, and fatigue under hydraulic loads.' },
  { key: 'seal', label: 'Seal', category: 'Containment', summary: 'Prevents process leakage.', details: 'Mechanical seal preventing fluid egress along rotating shaft while minimizing friction and thermal wear.' },
  { key: 'impeller', label: 'Impeller', category: 'Hydraulics', summary: 'Adds energy to fluid.', details: 'Rotating element converting mechanical shaft work into velocity and pressure rise within the casing.' },
  { key: 'housing', label: 'Casing', category: 'Hydraulics', summary: 'Flow passage enclosure.', details: 'Pressure boundary directing fluid, converting velocity to pressure in volute / diffuser regions; supports seal housing.' },
  { key: 'fasteners', label: 'Fasteners', category: 'Assembly', summary: 'Structural retention hardware.', details: 'Bolts/clamps maintaining compression, alignment and sealing integrity under thermal & vibratory cycling.' }
];

export function SupportPortal() { // repurposed as learning portal
  // Default theme set to dark per request; user may still toggle to light.
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scene, setScene] = useState<'production' | 'drilling' | 'lifecycle' | 'assembly'>('production');
  const [focus, setFocus] = useState<string | null>('pumpjack');
  const [show3D, setShow3D] = useState(true);
  const [brightness, setBrightness] = useState(1.6); // Increased default exposure (was 1.35)
  const [mode, setMode] = useState<'learn' | 'quiz'>('learn');
  const [quizIndex, setQuizIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [captureUrl, setCaptureUrl] = useState<string | null>(null);
  // CopilotChat now manages its own minimize state; always mounted.
  // Live flare rate forwarded to 3D scene for gas puff effects
  const [liveFlareRate, setLiveFlareRate] = useState<number>(12);
  const [recoveredVapors, setRecoveredVapors] = useState<number>(6); // initial mock recovered vapor volume (MSCF/d)
  const captureApiRef = useRef<{ capture: () => string } | null>(null);

  const activeConcepts = scene === 'production'
    ? productionConcepts
    : scene === 'drilling'
      ? drillingConcepts
      : scene === 'lifecycle'
        ? lifecycleConcepts
        : assemblyConcepts;
  const quizSequence = useMemo(() => activeConcepts.map(c => c.key), [activeConcepts]);
  const currentQuizKey = quizSequence[quizIndex];
  const currentConcept = activeConcepts.find(c => c.key === (mode === 'quiz' ? currentQuizKey : focus)) || activeConcepts[0];
  const conceptRef = useRef<HTMLDivElement | null>(null);
  const quizRevealRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Manage mode transitions without resetting quiz reveal repeatedly.
  const prevModeRef = useRef(mode);
  useEffect(() => {
    // Transition into quiz mode: clear focus once so user must identify visually.
    if (mode === 'quiz' && prevModeRef.current !== 'quiz') {
      setFocus(null);
      setRevealed(false); // reset only on entering quiz mode
    }
    // Returning to learn mode: ensure a default focus exists.
    if (mode === 'learn' && !focus) {
      if (scene === 'production') setFocus('pumpjack');
      else if (scene === 'drilling') setFocus('derrick');
      else if (scene === 'lifecycle') setFocus('upstream');
    }
    prevModeRef.current = mode;
  }, [mode, focus, scene]);

  // Reset focus when scene changes
  useEffect(()=>{
  if (scene === 'production') setFocus('pumpjack');
  else if (scene === 'drilling') setFocus('derrick');
  else if (scene === 'lifecycle') setFocus('upstream');
  else setFocus('impeller');
    setQuizIndex(0); setRevealed(false);
  }, [scene]);

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  function nextQuiz() {
    setRevealed(false);
    setQuizIndex(i => (i + 1) % quizSequence.length);
  }

  function revealAnswer() {
    setRevealed(true);
    setFocus(currentQuizKey);
  }

  // Stagger animate concept detail content whenever concept or mode changes (learn panel only)
  useEffect(() => {
    if (mode !== 'learn') return;
    const root = conceptRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll(':scope > *')) as HTMLElement[];
    if (els.length) staggerIn(els);
  }, [currentConcept?.key, mode, scene]);

  // Stagger list entries when sidebar opens
  useEffect(() => {
    if (!sidebarOpen) return;
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll('.concept-item')) as HTMLElement[];
    gsap.from(items, { opacity:0, x:-12, stagger:0.05, duration:0.4, ease:'power2.out' });
  }, [sidebarOpen, scene]);

  // Quiz reveal timeline animation
  useEffect(() => {
    if (mode !== 'quiz') return;
    const node = quizRevealRef.current;
    if (!node) return;
    gsap.fromTo(node, { autoAlpha:0, y:10 }, { autoAlpha:1, y:0, duration:0.45, ease:'power3.out' });
  }, [revealed, currentQuizKey, mode]);

  return (
    <div className="portal-layout" data-theme={theme}>
      <motion.header className="portal-header" initial={{ y:-32, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:.55 }}>
        <div className="left-header">
          <button
            className="sidebar-toggle"
            aria-label={sidebarOpen ? 'Close concept list' : 'Open concept list'}
            aria-controls="concept-list"
            onClick={() => setSidebarOpen(o => !o)}
            type="button"
          >☰</button>
          <h1>Energy Operations Learning Portal</h1>
        </div>
        <div className="header-actions">
          <select aria-label="Select scene" className="hdr-select" value={scene} onChange={e => setScene(e.target.value as 'production' | 'drilling' | 'lifecycle' | 'assembly')}>
            <option value="production">Production Pad</option>
            <option value="drilling">Drilling Rig</option>
            <option value="lifecycle">Lifecycle Map</option>
            <option value="assembly">Pump Assembly</option>
          </select>
          {scene !== 'lifecycle' && scene !== 'assembly' && (
            <>
              <button className="hdr-btn primary" onClick={() => setMode(m => m === 'learn' ? 'quiz' : 'learn')}>
                {mode === 'learn' ? 'Switch to Quiz' : 'Exit Quiz'}
              </button>
              <button className="hdr-btn ghost" onClick={() => setShow3D(v => !v)}>{show3D ? 'Hide 3D' : 'Show 3D'}</button>
            </>
          )}
          <button className="hdr-btn ghost theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
          {/* Copilot minimize handled inside component */}
        </div>
      </motion.header>
      <div className={`portal-body ${sidebarOpen ? 'mobile-sidebar-open' : ''}`}>
        <aside className={`tickets-pane ${sidebarOpen ? 'open' : ''}`} aria-label="Scene concepts list">
          <ul id="concept-list" className="ticket-list concept-scroll" aria-label="Elements" ref={listRef}>
            {activeConcepts.map(c => (
              <li key={c.key} className={`${c.key === focus ? 'active' : ''} concept-item`}>
                <button onClick={() => { setFocus(c.key); setMode('learn'); setSidebarOpen(false); }} className="concept-button">
                  <div className="subject-line">{c.label}</div>
                  <div className="meta-line">{c.category}</div>
                  <div className="description-line concept-summary">{c.summary}</div>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
        <main className="details-pane" aria-label="Concept details">
          <AnimatePresence mode="popLayout" initial={false}>
            {scene === 'lifecycle' && (
              <motion.div key="lifecycle-map" className="three-embed-container lifecycle-map-wrapper"
                initial={{ opacity:0, scale:.95 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:.9 }}
                transition={{ duration:.55 }}
              >
                <LifecycleMap focus={focus} onSelect={(k: string) => { setFocus(k); setMode('learn'); }} />
              </motion.div>
            )}
            {show3D && scene !== 'lifecycle' && scene !== 'assembly' && (
              <motion.div key="three" className="three-embed-container"
                initial={{ opacity:0, scale:.95 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:.9 }}
                transition={{ duration:.55 }}
              >
                {scene === 'production' ? (
                  <ThreeDashboard brightness={brightness} focus={focus} flareRate={liveFlareRate} recoveredVaporRate={recoveredVapors} onSelect={(k) => { setFocus(k); setMode('learn'); }} onReady={(api) => { captureApiRef.current = api; }} />
                ) : (
                  <DrillingRigScene brightness={brightness} focus={focus} onSelect={(k)=> { setFocus(k); setMode('learn'); }} onReady={(api)=> { captureApiRef.current = api; }} />
                )}
              </motion.div>
            )}
            {show3D && scene === 'assembly' && (
              <motion.div key="assembly" className="three-embed-container"
                initial={{ opacity:0, scale:.95 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:.9 }}
                transition={{ duration:.55 }}
              >
                <AssemblyExplodedScene brightness={brightness} focus={focus} onSelect={(k)=> { setFocus(k); setMode('learn'); }} onReady={(api)=> { captureApiRef.current = api; }} />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode + (currentConcept?.key || '')} initial={{ opacity:0, x:25 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:.45 }} className="learning-panel-wrapper">
              {mode === 'learn' && currentConcept && (
                <div className="ticket-detail concept-detail" ref={conceptRef}>
                  <div className="header-row"><h2 className="concept-title">{currentConcept.label}</h2><span className={`status-badge`}>{currentConcept.category}</span></div>
                  <p className="concept-summary-text">{currentConcept.summary}</p>
                  <p className="concept-details-text">{currentConcept.details}</p>
                  {scene === 'lifecycle' ? (
                    <div className="concept-hint">Lifecycle context: Upstream (find & produce) → Midstream (gather, process, transport) → Downstream (refine & deliver products).</div>
                  ) : (
                    <div className="concept-hint">Focus highlight in the 3D scene emphasizes emissive edges of the selected element.</div>
                  )}
                </div>
              )}
              {mode === 'quiz' && (scene === 'production' || scene === 'drilling') && (
                <div className="ticket-detail concept-detail quiz-mode">
                  <div className="header-row"><h2 className="concept-title">Identify This Element</h2><span className="status-badge">Quiz</span></div>
                  <p className="quiz-intro">Observe the 3D scene. Which element matches the clue below?</p>
                  <ul className="quiz-clue-list">
                    <li>Clue: {(() => {
                      if (scene === 'production') {
                        switch (currentQuizKey) {
                          case 'pumpjack': return 'Oscillating beam with horsehead converting motion to lift';
                          case 'vru': return 'Compact skid near tanks capturing vapors';
                          case 'wellheads': return 'Cluster of smaller vertical surface valve assemblies';
                          case 'separator': return 'Horizontal pressure vessel on a skid splitting phases';
                          case 'tanks': return 'Group of cylindrical vertical storage vessels';
                          case 'manifold': return 'Compact block receiving multiple incoming lines';
                          case 'pipelines': return 'Curved colored surface lines with moving markers';
                          case 'flare': return 'Slim stack with a breathing flame at top';
                          case 'kodrum': return 'Short vessel at base of flare handling liquids';
                          default: return 'Visible element';
                        }
                      } else if (scene === 'drilling') {
                        switch (currentQuizKey) {
                          case 'derrick': return 'Tall lattice providing vertical stand height';
                          case 'travelingblock': return 'Moving sheave set raising and lowering drill string';
                          case 'drillstring': return 'Long tubular assembly conveying torque to bit';
                          case 'mudpumps': return 'Reciprocating units driving drilling fluid circulation';
                          case 'bop': return 'Stack of preventers for well control';
                          default: return 'Rig component';
                        }
                      } else {
                        switch (currentQuizKey) {
                          case 'upstream': return 'Segment involving exploration, drilling and production';
                          case 'midstream': return 'Segment that gathers, conditions and transports hydrocarbons';
                          case 'downstream': return 'Segment that refines crude and markets end products';
                          default: return 'Lifecycle segment';
                        }
                      }
                    })()}</li>
                  </ul>
                  <div className="quiz-actions">
                    {!revealed && <button onClick={revealAnswer}>Reveal</button>}
                    {revealed && <button onClick={nextQuiz}>Next</button>}
                    <button onClick={() => setMode('learn')}>Back to Learn</button>
                  </div>
                  {revealed && currentConcept && (
                    <div className="quiz-reveal" ref={quizRevealRef}><strong>{currentConcept.label}</strong> – {currentConcept.details}</div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {/* Metrics & legend */}
          <div className="brightness-wrapper">
          {scene !== 'lifecycle' && (
            <div className="brightness-row" aria-label="Brightness control">
              <label>Scene Brightness</label>
              <input type="range" min={0.5} max={1.8} step={0.01} value={brightness} onChange={e => setBrightness(parseFloat(e.target.value))} aria-label="Adjust 3D scene brightness" />
              <span>{brightness.toFixed(2)}x</span>
            </div>
          )}
          <MetricsAndLegend focus={focus} concepts={activeConcepts} onSnapshot={() => {
              if (captureApiRef.current?.capture) {
                const data = captureApiRef.current.capture();
                setCaptureUrl(data);
              }
            }} captureUrl={captureUrl} onFlareRateChange={(v)=> setLiveFlareRate(v)} onRecoveredChange={(rv)=> setRecoveredVapors(rv)} />
          </div>
        </main>
      </div>
      <footer className="portal-footer">Educational mock data & visualization.</footer>
  <CopilotChat />
    </div>
  );
}

// Live metrics simulation + legend component
function MetricsAndLegend({ focus, concepts, onSnapshot, captureUrl, onFlareRateChange, onRecoveredChange }: { focus: string | null; concepts: SceneConcept[]; onSnapshot: () => void; captureUrl: string | null; onFlareRateChange?: (v:number)=>void; onRecoveredChange?: (v:number)=>void }) {
  const [tick, setTick] = useState(0);
  const oilRef = useRef<HTMLDivElement|null>(null);
  const gasRef = useRef<HTMLDivElement|null>(null);
  const waterRef = useRef<HTMLDivElement|null>(null);
  const tankRef = useRef<HTMLDivElement|null>(null);
  const sepRef = useRef<HTMLDivElement|null>(null);
  const flareRef = useRef<HTMLDivElement|null>(null);
  const recovRef = useRef<HTMLDivElement|null>(null);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t+1), 1500);
    return () => clearInterval(id);
  }, []);
  // Derived mock values
  // Target values
  const tOil = 480 + Math.sin(tick*0.9)*35;
  const tGas = 1.8 + Math.sin(tick*0.7)*0.12;
  const tWaterCut = 0.22 + (Math.sin(tick*0.5)*0.03);
  const tTank = 62 + (Math.sin(tick*0.4 + 1.3)*8);
  const tSepP = 145 + Math.sin(tick*0.8)*6;
  const tFlare = 12 + Math.max(0, Math.sin(tick*1.1))*6;
  // Recovered vapors – assume inverse relationship with portion of flash gas not flared. Mock dynamic trending.
  const tRecovered = 5.5 + Math.sin(tick*0.95 + 1.4)*2 + Math.max(0, 10 - tFlare*0.4)*0.15; // MSCF/d
  // Smoothed states
  const [oilRate, setOilRate] = useState(tOil);
  const [gasRate, setGasRate] = useState(tGas);
  const [waterCut, setWaterCut] = useState(tWaterCut);
  const [tankLevel, setTankLevel] = useState(tTank);
  const [sepPressure, setSepPressure] = useState(tSepP);
  const [flareRate, setFlareRate] = useState(tFlare);
  const [recovRate, setRecovRate] = useState(tRecovered);
  // Track previous values to decide when to pulse
  const prevVals = useRef({ oilRate, gasRate, waterCut, tankLevel, sepPressure, flareRate, recovRate });
  const capEffRef = useRef<HTMLDivElement|null>(null);
  const prevCapEff = useRef<number>(0);
  useEffect(() => {
    const id = requestAnimationFrame(function smooth() {
      const lerp = (a:number,b:number,f=0.12)=>a+(b-a)*f;
      setOilRate(o=>lerp(o,tOil));
      setGasRate(o=>lerp(o,tGas));
      setWaterCut(o=>lerp(o,tWaterCut));
      setTankLevel(o=>lerp(o,tTank));
      setSepPressure(o=>lerp(o,tSepP));
  setFlareRate(o=>lerp(o,tFlare));
  setRecovRate(o=>lerp(o,tRecovered));
      // Throttle flare rate notification to ~4 Hz
      if (onFlareRateChange) {
        const now = performance.now();
        if (window.__lastFlareDispatch === undefined || now - window.__lastFlareDispatch > 250) {
          window.__lastFlareDispatch = now;
          onFlareRateChange(tFlare);
          if (onRecoveredChange) onRecoveredChange(tRecovered);
        }
      }
      requestAnimationFrame(smooth);
    });
    return () => cancelAnimationFrame(id);
  }, [tOil,tGas,tWaterCut,tTank,tSepP,tFlare,tRecovered,onFlareRateChange,onRecoveredChange]);

  // Pulse animation when significant change occurs (>2% delta for rates, >3 psi sep pressure, >0.5% water cut)
  useEffect(() => {
    const pv = prevVals.current;
    const deltaPct = (a:number,b:number)=> b===0?0:Math.abs(a-b)/b;
    if (deltaPct(oilRate,pv.oilRate) > 0.02 && oilRef.current) pulseMetric(oilRef.current);
    if (deltaPct(gasRate,pv.gasRate) > 0.02 && gasRef.current) pulseMetric(gasRef.current);
    if (Math.abs(waterCut - pv.waterCut) > 0.005 && waterRef.current) pulseMetric(waterRef.current);
    if (deltaPct(tankLevel,pv.tankLevel) > 0.015 && tankRef.current) pulseMetric(tankRef.current);
    if (Math.abs(sepPressure - pv.sepPressure) > 3 && sepRef.current) pulseMetric(sepRef.current);
    if (Math.abs(flareRate - pv.flareRate) > 1 && flareRef.current) pulseMetric(flareRef.current);
    if (Math.abs(recovRate - pv.recovRate) > 0.5 && recovRef.current) pulseMetric(recovRef.current);
    const capEff = recovRate + flareRate > 0 ? (recovRate / (recovRate + flareRate) * 100) : 0;
    if (Math.abs(capEff - prevCapEff.current) > 3 && capEffRef.current) pulseMetric(capEffRef.current);
    prevCapEff.current = capEff;
    prevVals.current = { oilRate, gasRate, waterCut, tankLevel, sepPressure, flareRate, recovRate };
  }, [oilRate, gasRate, waterCut, tankLevel, sepPressure, flareRate, recovRate]);
  const focusLabel = focus ? concepts.find((c: SceneConcept) => c.key === focus)?.label : 'None';

  return (
    <div className="metrics-legend-grid">
      <div className="metric-block" aria-label="Live production metrics">
    <div className="metric-row" ref={oilRef}><span>Oil Rate</span><strong>{oilRate.toFixed(0)} bbl/d</strong></div>
    <div className="metric-row" ref={gasRef}><span>Gas Rate</span><strong>{gasRate.toFixed(2)} MMscf/d</strong></div>
    <div className="metric-row" ref={waterRef}><span>Water Cut</span><strong>{(waterCut*100).toFixed(1)}%</strong></div>
    <div className="metric-row" ref={tankRef}><span>Tank Level</span><strong>{tankLevel.toFixed(0)}%</strong></div>
    <div className="metric-row" ref={sepRef}><span>Separator P</span><strong>{sepPressure.toFixed(0)} psi</strong></div>
  <div className="metric-row" ref={flareRef}><span>Flare Volume</span><strong>{flareRate.toFixed(1)} MSCF/d</strong></div>
  <div className="metric-row" ref={recovRef}><span>Recovered Vapors</span><strong>{recovRate.toFixed(1)} MSCF/d</strong></div>
  <div className="metric-row small" ref={capEffRef}><span>Capture Efficiency</span><strong>{(recovRate / (recovRate + flareRate) * 100).toFixed(0)}%</strong></div>
        <div className="metric-focus">Focus: <em>{focusLabel}</em></div>
        <div className="metric-actions">
          <button type="button" onClick={onSnapshot}>Snapshot</button>
          {captureUrl && <a href={captureUrl} download="pad-snapshot.png">Download</a>}
        </div>
      </div>
      <div className="legend-block" aria-label="Color legend">
        <div className="legend-title">Legend</div>
        <ul className="legend-list">
          <li><span className="swatch oil" /> Oil Line</li>
          <li><span className="swatch gas" /> Gas Line</li>
          <li><span className="swatch water" /> Water Line</li>
          <li><span className="swatch flare" /> Flare</li>
          <li><span className="swatch highlight" /> Focus Highlight</li>
        </ul>
      </div>
    </div>
  );
}
