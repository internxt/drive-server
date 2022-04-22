import Analytics from '@rudderstack/rudder-sdk-node';
import { logError } from '../utils';

class AnalyticsV2 {
  analytics;

  constructor() {
    this.analytics = new Analytics(process.env.ANALYTICS_V2_WRITE_KEY || '', process.env.ANALYTICS_ENDPOINT || '');
  }

  track(params: any) {
    try {
      this.analytics.track(params);
    }
    catch(err: unknown) {
      logError(err);
    }
  }
}

export default new AnalyticsV2();