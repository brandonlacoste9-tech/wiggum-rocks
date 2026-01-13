import LocalAgent from './LocalAgent.js';
import AnalysisAgent from './AnalysisAgent.js';

export default class ModelRouter {
  constructor() {
    this.local = new LocalAgent();
    this.cloud = new AnalysisAgent();
  }

  route(error, files) {
    const msg = (error.message || '').toLowerCase();
    
    // Heuristics for syntax/reference errors
    const isSyntax = [
      'unexpected token',
      'missing',
      'expected',
      'syntax error',
      'referenceerror',
      'typeerror',
      'is not defined',
      'cannot read property'
    ].some(term => msg.includes(term));
    
    if (isSyntax) {
      console.log('🔀 Routing to LocalAgent (Ollama)');
      return this.local;
    }
    
    console.log('🔀 Routing to AnalysisAgent (Gemini)');
    return this.cloud;
  }
}
