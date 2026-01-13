import bus from '../EventBus.js';

export default class AnalysisAgent {
  constructor() {
    this.bus = bus;
  }

  async fix(error, files) {
    console.log('🤖 AnalysisAgent (Gemini) fixing...');
    
    // Check for license before even trying (Client-side optimization)
    const license = localStorage.getItem('adgenai_license');
    if (!license) throw new Error("License Required for Lisa Engine");

    const prompt = `Fix this logic error: ${error.message} \n Files: ${JSON.stringify(files)}`;
    
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Ralph-License': license
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (res.status === 403) throw new Error("License Invalid or Expired");
    
    const data = await res.json();
    const raw = data.candidates[0].content.parts[0].text;
    
    this._updateScore('lisa', 1);
    
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : raw);
    } catch {
      return { explanation: "Gemini response parse error" };
    }
  }

  _updateScore(agent, delta) {
    const key = `${agent}Score`;
    const val = Number(localStorage.getItem(key) || '0') + delta;
    localStorage.setItem(key, val);
    this.bus.emit('score.update', { agent, score: val });
  }
}
