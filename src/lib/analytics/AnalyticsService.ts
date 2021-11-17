import Analytics from './Analytics';
const logger = require('../../lib/logger').default;
const Logger = logger.getInstance();
// PROVISIONAL until express server typescript
import express from 'express';



async function trackDeactivationRequest(userId: string) {
  Analytics.track({
    userId,
    event: 'Deactivation Requested'
  });
}

async function trackSignUp(req: express.Request) {
  //TODO
}

async function trackInvitationSent(userId: string, inviteEmail: string) {
  Analytics.track({
    userId,
    event: 'Invitation Sent',
    properties: { sent_to: inviteEmail }
  });
}

async function trackDeactivationconfirmed(userId: string) {
  Analytics.track({
    userId,
    event: 'Deactivation Confirmed'
  });
}

async function trackReferralRedeemed(userId: string, referralKey: string) {
  Analytics.track({
    userId,
    event: 'Referral Redeemed',
    properties: {
      name: referralKey
    }
  });
}

async function trackInvitationAccepted(userId: string, referredBy: string, sentBy: string) {
  Analytics.identify({
    userId,
    traits: { referred_by: referredBy }
  });
  Analytics.track({
    userId,
    event: 'Invitation Accepted',
    properties: { sent_by: sentBy }
  });
}


const AnalyticsService = {
  trackDeactivationconfirmed,
  trackDeactivationRequest,
  trackInvitationAccepted,
  trackInvitationSent,
  trackSignUp,
  trackReferralRedeemed
};

export default AnalyticsService;
