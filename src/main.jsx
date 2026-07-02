import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const specimens = [
  { id: 'MZ-041', name: 'paperclipper', family: 'macro worm / toy', entropy: 62, color: '#d7bb73', bytes: '4D 5A 90 00 03 00 00 00 FF FF 00 00 B8 00 00 00 40 00 00 00 73 74 75 62 2E 65 78 65' },
  { id: 'MZ-118', name: 'smoke courier', family: 'beacon dropper / synthetic', entropy: 78, color: '#cf6f4b', bytes: '7F 45 4C 46 02 01 01 00 00 00 00 00 54 49 4D 45 52 20 50 49 50 45 20 46 44' },
  { id: 'MZ-203', name: 'bad tulip', family: 'polymorph / toy', entropy: 89, color: '#8fb069', bytes: 'CA FE BA BE 00 00 00 34 52 55 4E 45 20 4D 41 50 20 41 44 44 52 20 30 78' }
];

const baseEvents = [
  ['spawn', 'loader touched temp spool', 0.18],
  ['fork', 'child process requested desk lamp handle', 0.36],
  ['write', 'dropped harmless decoy note in user cache', 0.43],
  ['net', 'synthetic beacon attempted 198.51.100.42', 0.71],
  ['mutex', 'created brass_lock_09', 0.52],
  ['scan', 'rule tooth matched folded string table', 0.66],
  ['quarantine', 'operator sealed drawer compartment', 0.88],
  ['sleep', 'sample waited under sandbox clock', 0.31]
];

const rules = [
  { key: 'strings', label: 'string teeth', weight: 0.22 },
  { key: 'tree', label: 'process grafts', weight: 0.31 },
  { key: 'net', label: 'beacon ash', weight: 0.27 },
  { key: 'entropy', label: 'packed entropy', weight: 0.20 }
];

function useTicker() {
  const [tick, setTick] = useState(0);
  const last = useRef(performance.now());
  useEffect(() => {
    let raf = 0;
    const loop = (now) => {
      const dt = Math.min((now - last.current) / 1000, 0.05);
      last.current = now;
      setTick((t) => t + dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return tick;
}

function RackMeter({ label, value, color }) {
  return <div className="meter" aria-label={`${label} ${Math.round(value)} percent`}>
    <span>{label}</span>
    <div className="meterTrack"><i style={{ width: `${value}%`, background: color }} /></div>
    <b>{Math.round(value).toString().padStart(2,'0')}</b>
  </div>;
}

function Toggle({ on, label, onClick }) {
  return <button className={on ? 'toggle on' : 'toggle'} onClick={onClick} aria-pressed={on}>{label}<span /></button>;
}

function HexTray({ specimen, t, severity }) {
  const cells = useMemo(() => specimen.bytes.split(' '), [specimen]);
  return <section className="drawer hexTray" aria-label="hex specimen drawer">
    <div className="drawerHandle"><b>{specimen.id}</b><span>{specimen.family}</span></div>
    <div className="hexGrid">
      {cells.concat(cells.slice(0, 28)).map((byte, i) => {
        const hot = (Math.sin(t * 2.1 + i * .7) + severity / 100) > 0.78;
        return <code key={i} className={hot ? 'hot' : ''}>{byte}</code>;
      })}
    </div>
  </section>;
}

function ProcessTree({ t, sealed }) {
  const nodes = [
    ['sample.exe', 15, 18, 24], ['rundesk.tmp', 35, 34, 17], ['lampbroker', 59, 27, 13],
    ['curl-ghost', 71, 53, 20], ['notepad.decoy', 29, 62, 15], ['mutex-wait', 53, 73, 16], ['sinkhole', 82, 78, 14]
  ];
  return <section className="drawer processDrawer" aria-label="synthetic process tree">
    <div className="drawerHandle"><b>process drawer</b><span>{sealed ? 'quarantined' : 'detonating'}</span></div>
    <svg viewBox="0 0 100 100" role="img" aria-label="animated sandbox process tree">
      <defs><filter id="rough"><feTurbulence baseFrequency="0.018" numOctaves="2"/><feDisplacementMap in="SourceGraphic" scale="0.5"/></filter></defs>
      {nodes.slice(1).map((n, i) => <line key={'l'+i} x1={nodes[Math.floor(i/2)][1]} y1={nodes[Math.floor(i/2)][2]} x2={n[1]} y2={n[2]} className="edge" />)}
      {nodes.map((n, i) => <g key={n[0]} transform={`translate(${n[1]},${n[2]})`} className={sealed && i>2 ? 'sealed' : ''}>
        <circle r={n[3]/2 + Math.sin(t*3+i)*0.8} />
        <text y={-n[3]/2-2} textAnchor="middle">{n[0]}</text>
      </g>)}
    </svg>
  </section>;
}

function EventTape({ t, sensitivity }) {
  const offset = Math.floor(t * 2) % baseEvents.length;
  const ordered = baseEvents.map((_, i) => baseEvents[(i + offset) % baseEvents.length]);
  return <section className="eventTape" aria-label="sandbox event tape">
    <header><b>event tape</b><span>threshold {sensitivity}%</span></header>
    {ordered.map((e, i) => <div className="event" key={i} style={{ '--risk': e[2] }}>
      <time>+{(t + i * .73).toFixed(2)}s</time><strong>{e[0]}</strong><span>{e[1]}</span><em>{Math.round(e[2]*sensitivity)}%</em>
    </div>)}
  </section>;
}

function App() {
  const t = useTicker();
  const [specimenIndex, setSpecimenIndex] = useState(1);
  const [detonation, setDetonation] = useState(64);
  const [sensitivity, setSensitivity] = useState(72);
  const [sealed, setSealed] = useState(false);
  const [enabled, setEnabled] = useState({ strings: true, tree: true, net: true, entropy: false });
  const specimen = specimens[specimenIndex];
  const ruleScore = rules.reduce((acc, r) => acc + (enabled[r.key] ? r.weight : 0), 0);
  const severity = Math.min(98, specimen.entropy * ruleScore + detonation * .42 + Math.sin(t * 1.3) * 7 - (sealed ? 24 : 0));
  const net = Math.max(3, severity * (enabled.net ? 0.9 : 0.18));
  const fork = Math.max(5, severity * (enabled.tree ? 0.78 : 0.25));
  return <main className="app">
    <section className="console" aria-label="malware zoo sandbox theater">
      <div className="topBar">
        <div><p className="eyebrow">MALWARE ZOO / SAFE SYNTHETIC SAMPLE ONLY</p><h1>specimen drawer</h1></div>
        <div className="runPlate"><span>RUN {Math.floor(t).toString().padStart(4,'0')}</span><b>{sealed ? 'sealed' : 'live sandbox'}</b></div>
      </div>
      <div className="rack">
        <aside className="specimens" aria-label="specimen selector">
          {specimens.map((s, i) => <button key={s.id} onClick={() => setSpecimenIndex(i)} className={i === specimenIndex ? 'card active' : 'card'}>
            <span>{s.id}</span><b>{s.name}</b><small>{s.family}</small><i style={{ background: s.color }} />
          </button>)}
        </aside>
        <div className="core">
          <HexTray specimen={specimen} t={t} severity={severity}/>
          <ProcessTree t={t} sealed={sealed}/>
          <EventTape t={t} sensitivity={sensitivity}/>
        </div>
        <aside className="controls" aria-label="integrated quarantine controls">
          <div className="breakerPanel">
            <h2>rule teeth</h2>
            {rules.map(r => <Toggle key={r.key} label={r.label} on={enabled[r.key]} onClick={() => setEnabled(v => ({ ...v, [r.key]: !v[r.key] }))} />)}
          </div>
          <label className="lever">detonation clock <output>{detonation}s</output><input aria-label="detonation clock" type="range" min="12" max="96" value={detonation} onChange={e=>setDetonation(Number(e.target.value))}/></label>
          <label className="lever">sensitivity gate <output>{sensitivity}%</output><input aria-label="sensitivity gate" type="range" min="35" max="95" value={sensitivity} onChange={e=>setSensitivity(Number(e.target.value))}/></label>
          <button className="seal" onClick={() => setSealed(s=>!s)}>{sealed ? 'unseal drawer' : 'slam quarantine drawer'}</button>
          <div className="meters">
            <RackMeter label="severity" value={severity} color="#cf6f4b" />
            <RackMeter label="fork pressure" value={fork} color="#d7bb73" />
            <RackMeter label="beacon ash" value={net} color="#8fb069" />
          </div>
        </aside>
      </div>
      <footer>fictional local sandbox. no real samples, no exploit payloads, no network calls. a theatrical reverse-engineering instrument, not malware tooling.</footer>
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
