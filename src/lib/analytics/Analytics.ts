import AnalyticsRudder from '@rudderstack/rudder-sdk-node';
import { logError } from './utils';

class Analytics {
  analytics!: AnalyticsRudder;

  constructor() {
    try {
      this.analytics = new AnalyticsRudder(
        process.env.ANALYTICS_RUDDER_KEY || '',
        process.env.ANALYTICS_RUDDER_PLAN_URL || '',
      );
    } catch (err: any) {
      logError(`Error initializing analytics: ${err.message}`);
    }
  }

  track(params: any) {
    try {
      this.analytics.track(params);
    } catch (err: unknown) {
      logError(err);
    }
  }

  identify(params: any) {
    try {
      this.analytics.identify(params);
    } catch (err: unknown) {
      logError(err);
    }
  }

  page(params: any) {
    try {
      this.analytics.page(params);
    } catch (err: unknown) {
      logError(err);
    }
  }
}

export default new Analytics();
