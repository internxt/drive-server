import AnalyticsSegment from 'analytics-node';
import { logError } from './utils';

class Analytics {

  analytics: AnalyticsSegment;

  constructor() {
    this.analytics = new AnalyticsSegment(process.env.APP_SEGMENT_KEY || 'xxx');
  }

  track(params: any) {
    try {
      this.analytics.track(params);
    }
    catch (err: unknown) {
      logError(err);
    }
  }

  identify(params: any) {
    try {
      this.analytics.identify(params);
    }
    catch (err: unknown) {
      logError(err);
    }
  }
}

export default new Analytics();