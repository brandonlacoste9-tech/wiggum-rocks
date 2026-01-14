import React, { useState, useEffect } from 'react';
import { orchestrator } from './Orchestrator';
import bus from './EventBus';

function App() {
  const [started, setStarted] = useState(false);
  const [log, setLog] = useState([]);
  const [theme, setTheme] = useState('standard-green');
  const [licenseInfo, setLicenseInfo] = useState({ tier: 'free' });
  const [ralphQuote, setRalphQuote] = useState("I'm learning!");
  const [showHelp, setShowHelp] = useState(false);

  // File System State
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('wiggum_files');
    return saved ? JSON.parse(saved) : {
      'main.js': `// ----------------------------------------------------
// MISSION: BREAK THIS CODE
// ----------------------------------------------------
// 1. Ralph (The Infant) fixes syntax errors.
//    TRY: Delete a bracket '}' or misspell 'function'.
//
// 2. Lisa (Locked) fixes logic errors.
//    TRY: Reference a variable that doesn't exist.
// ----------------------------------------------------

function startEngine() {
  const fuel = 100;
  console.log("Vroom Vroom");
  return true;
}

// STEP 3: Press [RUN] or Ctrl+Enter to trigger the AI.`,
      'utils.js': 'export const add = (a, b) => a + b;',
      'notes.txt': 'Ralph is a good boy.'
    };
  });
  const [activeFile, setActiveFile] = useState('main.js');

  useEffect(() => {
    localStorage.setItem('wiggum_files', JSON.stringify(files));
  }, [files]);

  const updateFile = (val) => {
    setFiles(prev => ({ ...prev, [activeFile]: val }));
  };

  const addFile = () => {
    const name = prompt("File Name (e.g., component.js):");
    if (name) {
      setFiles(prev => ({ ...prev, [name]: '// New File' }));
      setActiveFile(name);
    }
  };

  const deleteFile = () => {
    if (Object.keys(files).length <= 1) return alert("Must keep one file!");
    if (confirm(`Delete ${activeFile}?`)) {
      const newFiles = { ...files };
      delete newFiles[activeFile];
      setFiles(newFiles);
      setActiveFile(Object.keys(newFiles)[0]);
    }
  };

  const ralphQuotes = [
    "I'm learning!",
    "My cat's breath smells like cat food.",
    "I bent my wookie.",
    "Me fail English? That's unpossible!",
    "I'm a unit test!",
    "It tastes like burning!",
    "Principalskipster! I found some code!",
    "I'm helping!",
    "Go banana!"
  ];

  const burnsQuotes = [
    "Excellent...",
    "Release the hounds.",
    "Smithers, who is this incompetent unit unit?",
    "I'll keep my eye on you...",
    "You call this code? It's pathetic.",
    "Money fight!",
    "Family. Religion. Friendship. These are the three demons you must slay if you wish to succeed in business."
  ];

  useEffect(() => {
    const list = licenseInfo.tier === 'enterprise' ? burnsQuotes : ralphQuotes;
    const interval = setInterval(() => {
       setRalphQuote(list[Math.floor(Math.random() * list.length)]);
    }, 5000);
    setRalphQuote(list[Math.floor(Math.random() * list.length)]);
    return () => clearInterval(interval);
  }, [licenseInfo.tier]);

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

  const milhouseQuotes = [
    "Everything's coming up Milhouse!",
    "My mom says I'm cool.",
    "I'm not a nerd!",
    "Remember the time I ate my goldfish? And you lied and said I didn't have any goldfish. But why did I have the bowl, Bart? Why did I have the bowl?",
    "Step over this line and you're dead! ... Please don't step over that line.",
    "Thrillhouse!",
    "Is this the way to the cafeteria?"
  ];

  const askMilhouse = () => {
    const quote = milhouseQuotes[Math.floor(Math.random() * milhouseQuotes.length)];
    setLog(prev => [...prev, `👓 MILHOUSE: "${quote}"`]);
    speak(quote, "milhouse");
  };

  const speak = (text, persona) => {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    
    if (persona === 'burns') {
      u.pitch = 0.1; 
      u.rate = 0.8; 
    } else if (persona === 'ralph') {
      u.pitch = 1.5; 
      u.rate = 1.1; 
    } else if (persona === 'milhouse') {
      u.pitch = 1.2; // Nasal
      u.rate = 1.0;
    } else if (persona === 'hounds') {
      u.pitch = 0.5;
      u.rate = 2.0;
      u.volume = 1.0;
    }
    window.speechSynthesis.speak(u);
  };

  const runCode = async () => {
    const codeToRun = files[activeFile];
    setLog(prev => [...prev, `> Running ${activeFile}...`]);
    try {
      if (activeFile.endsWith('.js')) {
          eval(codeToRun);
          setLog(prev => [...prev, `> Execution Successful.`]);
      } else {
          setLog(prev => [...prev, `> Skipped execution (not a .js file)`]);
      }
    } catch (e) {
      setLog(prev => [...prev, `❌ ERROR: ${e.message}`]);
      
      try {
        const fix = await orchestrator.analyze(e, files);
        
        setLog(prev => [...prev, `💡 FIX PROPOSED (${fix.explanation || 'Analyzed'}):`]);
        setLog(prev => [...prev, JSON.stringify(fix.patches || fix, null, 2)]);
        
        if (fix.patches && fix.patches.length > 0) {
           const p = fix.patches[0];
           
           setFiles(prev => {
             const targetFile = p.file || activeFile; 
             if (!prev[targetFile]) return prev;
             
             return {
               ...prev,
               [targetFile]: prev[targetFile].replace(p.old, p.new)
             };
           });

           setLog(prev => [...prev, `✨ PATCH APPLIED!`]);
           
           if (licenseInfo.tier === 'enterprise') {
             speak("Excellent...", "burns");
           } else {
             speak("I'm helping!", "ralph");
           }
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
        <button onClick={() => {
            setStarted(true);
            if (licenseInfo.tier === 'enterprise') speak("Excellent", "burns");
            else speak("Using the computer!", "ralph");
        }}>START GAME</button>
        
        <div style={{marginTop: 20, display: 'flex', gap: '10px', justifyContent: 'center'}}>
            <a href="/pricing" className="btn" style={{fontSize: '12px', textDecoration: 'none', color: '#0f0', border: '2px solid #0f0', padding: '10px'}}>BUY LICENSE</a>
            <a href="/activate" className="btn" style={{fontSize: '12px', textDecoration: 'none', color: '#0f0', border: '2px solid #0f0', padding: '10px'}}>ENTER KEY</a>
        </div>

        <div style={{marginTop: 20, fontSize: 10}}>LICENSE: {licenseInfo.tier.toUpperCase()}</div>
      </div>
    );
  }

  return (
    <div className={`screen main-ui ${theme}`} style={{'--theme-color': theme === 'luxury-gold' ? '#ffd700' : '#0ff'}}>
      <div className="header">
        <span>MODE: {licenseInfo.tier === 'enterprise' ? '👑 GOD' : '👶 INFANT (SYNTAX ONLY)'}</span>
        <span>RALPH: "{ralphQuote}"</span>
        <span>LISA: {licenseInfo.tier !== 'free' ? 'ONLINE' : 'LOCKED'}</span>
      </div>
      
      <div className="ide-layout">
        <div className="sidebar">
           <div className="sidebar-actions sidebar-tools">
             <button onClick={addFile}>+ NEW</button>
             <button onClick={deleteFile}>- DEL</button>
             <button onClick={() => {
                 setShowHelp(true);
                 askMilhouse();
             }} style={{color: '#89CFF0'}}>👓 HELP</button>
           </div>
           <ul className="file-list">
             {Object.keys(files).map(f => (
               <li 
                 key={f} 
                 className={`file-item ${activeFile === f ? 'active' : ''}`}
                 onClick={() => setActiveFile(f)}
               >
                 📄 {f}
               </li>
             ))}
           </ul>
        </div>

        <div className="editor-container">
          <textarea 
            value={files[activeFile] || ''} 
            onChange={e => updateFile(e.target.value)}
            spellCheck="false"
          />
          <div className="terminal">
             {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>

      <div className="controls">
        <button onClick={runCode}>RUN (CTRL+ENTER)</button>
        <button onClick={() => setLog([])}>CLEAR</button>
        {licenseInfo.tier === 'enterprise' && (
          <button 
            onClick={() => { 
                setLog(['🐕 RELEASE THE HOUNDS!', ...log]); 
                speak("Release the hounds.", "burns");
                setTimeout(() => speak("Bark bark bark bark bark!", "hounds"), 1000);
                setTimeout(() => setLog([]), 2000); 
            }}
            style={{color: 'var(--neon-gold)', borderColor: 'var(--neon-gold)'}}
          >
            RELEASE HOUNDS
          </button>
        )}
        <button onClick={() => setStarted(false)}>EXIT</button>
      </div>

      {showHelp && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.9)', zIndex: 9999, 
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="panel" style={{
                width: '500px', padding: '20px', 
                boxShadow: '0 0 20px var(--neon-pink)', 
                background: '#111', border: '2px solid var(--neon-pink)',
                textAlign: 'left'
            }}>
                <h2 style={{color: 'var(--neon-pink)', textAlign: 'center', marginTop: 0}}>HOW TO PLAY</h2>
                <ul style={{fontSize: '12px', lineHeight: 1.8, color: '#fff', listStyle: 'none', padding: 0}}>
                <li>🛑 <strong>GOAL:</strong> Write broken JavaScript.</li>
                <li>👶 <strong>RALPH:</strong> Runs locally (Ollama). He fixes typos, missing brackets, and syntax crashes. He is free but not very smart.</li>
                <li>🧠 <strong>LISA:</strong> Runs in the cloud (Gemini). She understands logic, context, and intent. <span style={{color: 'var(--neon-pink)'}}>Requires License.</span></li>
                <li>🚨 <strong>187 ALARM:</strong> Triggers when code fails.</li>
                </ul>
                <button onClick={() => setShowHelp(false)} 
                        style={{
                            width: '100%', marginTop: '20px', padding: '15px', 
                            background: '#000', color: '#0ff', 
                            border: '2px solid #0ff', cursor: 'pointer',
                            fontFamily: '"Press Start 2P", cursive'
                        }}>
                GOT IT
                </button>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
