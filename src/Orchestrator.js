import bus from './EventBus.js';
import ModelRouter from './agents/ModelRouter.js';

class Orchestrator {
  constructor() {
    this.router = new ModelRouter();
  }

  async analyze(error, files) {
    console.log('🚀 Orchestrator active:', error.message);
    try {
      const agent = this.router.route(error, files);
      const result = await agent.fix(error, files);
      bus.emit('analysis.complete', result);
      return result;
    } catch (e) {
      console.error(e);
      bus.emit('analysis.failed', e);
      throw e;
    }
  }
}

export const orchestrator = new Orchestrator();
