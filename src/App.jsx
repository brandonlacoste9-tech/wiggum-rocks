import React, { useState, useEffect } from 'react';
import { orchestrator } from './Orchestrator';
import bus from './EventBus';

function App() {
  const [started, setStarted] = useState(false);
  const [code, setCode] = useState('// Write some buggy code here...\nconst x = ;');
  const [log, setLog] = useState([]);
  const [theme, setTheme] = useState('standard-green');
  const [licenseInfo, setLicenseInfo] = useState({ tier: 'free' });
  const [ralphQuote, setRalphQuote] = useState("I'm learning!");

  const ralphQuotes = [
    "I'm learning!",
    "My cat's breath smells like cat food.",
    "I bent my wookie.",
    "Me fail English? That's unpossible!",
    "I'm a unit test!",
    "It tastes like burning!",
    "Principalskipster! I found some code!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setRalphQuote(ralphQuotes[Math.floor(Math.random() * ralphQuotes.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load License/Theme on mount
  useEffect(() => {
    const checkStatus = async () => {
      const token = localStorage.getItem('adgenai_license');
      try {
        const res = await fetch('/api/status', {
           headers: token ? { 'X-Ralph-License': token } : {} 
        });
        const data = await res.json();
        setTheme(data.theme || 'standard-green');
        setLicenseInfo(data);
        if(token) console.log("💎 LICENSE DETECTED:", data.tier.toUpperCase());
      } catch(e) { console.error("Status check failed", e); }
    };
    checkStatus();
  }, []);

  const runCode = async () => {
    setLog(prev => [...prev, `> Running code...`]);
    try {
      // Intentional Eval to catch syntax errors for demonstration
      // In a real app, this would use the Bundler/Sandbox
      eval(code); 
      setLog(prev => [...prev, `> Execution Successful.`]);
    } catch (e) {
      setLog(prev => [...prev, `❌ ERROR: ${e.message}`]);
      
      // TRIGGER THE ORCHESTRATOR
      try {
        const fix = await orchestrator.analyze(e, { 'App.jsx': code });
        setLog(prev => [...prev, `💡 FIX PROPOSED (${fix.explanation || 'Analyzed'}):`]);
        setLog(prev => [...prev, JSON.stringify(fix.patches || fix, null, 2)]);
        
        // Auto-apply first patch if available (Demo mode)
        if (fix.patches && fix.patches.length > 0) {
           const p = fix.patches[0];
           setCode(prev => prev.replace(p.old, p.new));
           setLog(prev => [...prev, `✨ PATCH APPLIED!`]);
        }

      } catch (analysisErr) {
        setLog(prev => [...prev, `☠️ ANALYSIS FAILED: ${analysisErr.message}`]);
      }
    }
  };

  if (!started) {
    return (
      <div className={`screen title-screen ${theme}`}>
        <h1>WIGGUM.ROCKS</h1>
        <p>HYBRID AI SURGICAL ENGINE</p>
        <div className="blink">INSERT COIN (CLICK START)</div>
        <button onClick={() => setStarted(true)}>START GAME</button>
        <div style={{marginTop: 20, fontSize: 10}}>LICENSE: {licenseInfo.tier.toUpperCase()}</div>
      </div>
    );
  }

  return (
    <div className={`screen main-ui ${theme}`}>
      <div className="header">
        <span>MODE: {licenseInfo.tier === 'enterprise' ? '👑 GOD' : '👶 INFANT'}</span>
        <span>RALPH: "{ralphQuote}"</span>
        <span>LISA: {licenseInfo.tier !== 'free' ? 'ONLINE' : 'LOCKED'}</span>
      </div>
      <div className="editor-container">
        <textarea 
          value={code} 
          onChange={e => setCode(e.target.value)}
          spellCheck="false"
        />
        <div className="terminal">
           {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
      <div className="controls">
        <button onClick={runCode}>RUN (CTRL+ENTER)</button>
        <button onClick={() => setLog([])}>CLEAR</button>
        <button onClick={() => setStarted(false)}>EXIT</button>
      </div>
    </div>
  );
}

export default App;
