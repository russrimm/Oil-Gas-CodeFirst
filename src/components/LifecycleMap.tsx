import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import '../lifecycleMap.css';

interface LifecycleMapProps {
  focus: string | null;
  onSelect?: (key: string) => void;
}

// Stage metadata (avoid copying proprietary infographic text verbatim – original wording)
interface StageMeta { key:string; title:string; subtitle:string; chips:string[]; icon:React.ReactNode; description:string }

const STAGES: StageMeta[] = [
  {
    key: 'upstream',
    title: 'Upstream',
    subtitle: 'Exploration & Production',
    chips: ['Seismic', 'Drilling', 'Completions', 'Lift', 'Recovery'],
    icon: (
      <svg viewBox="0 0 40 40" aria-hidden="true" className="lm-ic">
        <path d="M20 2 L26 14 H22 L30 34 H24 L20 24 L16 34 H10 L18 14 H14 Z" fill="currentColor" />
      </svg>
    ),
    description: 'Locating reservoirs, drilling wells, completing, and producing hydrocarbons.'
  },
  {
    key: 'midstream',
    title: 'Midstream',
    subtitle: 'Gathering & Transport',
    chips: ['Gathering', 'Stabilize', 'Treat', 'Compress', 'Store', 'Pipeline'],
    icon: (
      <svg viewBox="0 0 40 40" aria-hidden="true" className="lm-ic">
        <rect x="4" y="16" width="32" height="8" rx="4" fill="currentColor" />
        <circle cx="12" cy="20" r="5" fill="var(--stage-accent)" />
      </svg>
    ),
    description: 'Conditioning, treating, and transporting produced fluids & gases to markets.'
  },
  {
    key: 'downstream',
    title: 'Downstream',
    subtitle: 'Refining & Marketing',
    chips: ['Refining', 'Conversion', 'Treating', 'Blending', 'Chemicals', 'Distribution'],
    icon: (
      <svg viewBox="0 0 40 40" aria-hidden="true" className="lm-ic">
        <rect x="8" y="10" width="8" height="20" fill="currentColor" />
        <rect x="20" y="6" width="8" height="24" fill="currentColor" />
        <rect x="32" y="14" width="4" height="16" fill="currentColor" />
      </svg>
    ),
    description: 'Refining crude & natural gas liquids into finished fuels and petrochemicals.'
  }
];

export const LifecycleMap: React.FC<LifecycleMapProps> = ({ focus, onSelect }) => {
  const rootRef = useRef<HTMLDivElement|null>(null);
  const pipelineRef = useRef<HTMLDivElement|null>(null);

  // Intro animation
  useEffect(() => {
    const root = rootRef.current; if (!root) return;
    const stages = root.querySelectorAll('.lm-stage');
    gsap.set(stages, { autoAlpha:0, y:24 });
    gsap.to(stages, { autoAlpha:1, y:0, ease:'power3.out', duration:0.7, stagger:0.15 });
  }, []);

  // Focus pulse
  useEffect(() => {
    const root = rootRef.current; if (!root) return;
    root.querySelectorAll('.lm-stage').forEach(el=>el.classList.remove('active'));
    if (!focus) return;
    const el = root.querySelector(`.lm-stage[data-key="${focus}"]`);
    if (el) {
      el.classList.add('active');
      gsap.fromTo(el, { boxShadow:'0 0 0 0 rgba(255,255,255,0.35)' }, { boxShadow:'0 0 0 10px rgba(255,255,255,0)', duration:1.6, ease:'power2.out' });
    }
  }, [focus]);

  // Pipeline flow dots animation
  useEffect(() => {
    const pipeline = pipelineRef.current; if (!pipeline) return;
    const dots = pipeline.querySelectorAll('.lm-flow-dot');
    const width = pipeline.clientWidth;
    dots.forEach((d,i) => {
      gsap.fromTo(d, { x:-20 }, { x: width + 20, duration: 6, ease:'none', repeat:-1, delay: i * 1.8 });
    });
  }, []);

  return (
    <div className="lifecycle-map value-chain" ref={rootRef} aria-label="Oil & gas lifecycle value chain visualization">
      <div className="lm-chain" role="list">
        {STAGES.map(s => (
          <div
            key={s.key}
            className={`lm-stage ${focus === s.key ? 'active' : ''}`}
            data-key={s.key}
            onClick={() => onSelect && onSelect(s.key)}
            role="listitem"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onSelect) onSelect(s.key);
              }
            }}
          >
            <div className="stage-bar" aria-hidden="true" />
            <div className="stage-head">
              <div className="stage-icon" aria-hidden="true">{s.icon}</div>
              <div className="stage-titles">
                <h3 className="stage-title">{s.title}</h3>
                <div className="stage-sub">{s.subtitle}</div>
              </div>
            </div>
            <p className="stage-desc">{s.description}</p>
            <ul className="stage-chips" aria-label={`${s.title} key activities`}>
              {s.chips.map(c => <li key={c}>{c}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="lm-pipeline" ref={pipelineRef} aria-hidden="true">
        <div className="pipe" />
        <div className="lm-flow-dot" />
        <div className="lm-flow-dot" />
        <div className="lm-flow-dot" />
      </div>
      <div className="lm-legend" aria-label="Stages legend">
        <span><span className="sw upstream" /> Upstream</span>
        <span><span className="sw midstream" /> Midstream</span>
        <span><span className="sw downstream" /> Downstream</span>
      </div>
    </div>
  );
};

export default LifecycleMap;