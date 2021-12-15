export class ReferralsNotAvailableError extends Error {
  constructor() {
    super('Referrals program not available for this user');
  }
}
