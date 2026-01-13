import bus from '../EventBus.js';

export default class LocalAgent {
  constructor() {
    this.bus = bus;
    this.model = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
  }

  async fix(error, files) {
    console.log(`🤖 LocalAgent (Ollama) fixing – model: ${this.model}`);
    
    const prompt = this._buildPrompt(error, files);
    const raw = await this._callOllama(prompt);
    const result = this._parseResponse(raw);
    
    // Update score (negative for Ralph bugs)
    this._updateScore('ralph', -1);
    return result;
  }

  _buildPrompt(error, files) {
    return `You are Ralph-Fixer. Fix this JavaScript error.
ERROR: ${error.message}
FILES: ${JSON.stringify(files)}
Return JSON: { "filename": "x.js", "line": 1, "patches": [{"old":"", "new":""}], "explanation": "" }`;
  }

  async _callOllama(prompt) {
    // Attempt to hit the proxy first
    try {
      const res = await fetch(`/api/ollama/${this.model}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      const data = await res.json();
      return data.message?.content || data;
    } catch (e) {
      console.error('Ollama LocalAgent failed', e);
      throw e;
    }
  }

  _parseResponse(raw) {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : raw);
    } catch {
      return { explanation: "I bent my wookie (JSON Parse Error)" };
    }
  }

  _updateScore(agent, delta) {
    const key = `${agent}Score`;
    const val = Number(localStorage.getItem(key) || '0') + delta;
    localStorage.setItem(key, val);
    this.bus.emit('score.update', { agent, score: val });
  }
}
