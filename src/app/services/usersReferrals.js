import { ReferralsNotAvailableError } from './errors/referrals';

const AnalyticsService = require('../../lib/analytics/AnalyticsService');

module.exports = (Model, App) => {
  const createUserReferrals = async (userId) => {
    const referrals = await App.services.Referrals.getAllEnabled();
    const userReferralsToCreate = [];

    referrals.forEach((referral) => {
      Array(referral.steps)
        .fill()
        .forEach(() => {
          const applied = referral.key === 'create-account';

          userReferralsToCreate.push({
            user_id: userId,
            referral_id: referral.id,
            start_date: new Date(),
            applied,
          });
        });
    });

    await Model.users_referrals.bulkCreate(userReferralsToCreate, {
      individualHooks: true,
      fields: ['user_id', 'referral_id', 'start_date', 'applied'],
    });
  };

  const update = async (data, userReferralId) => {
    return Model.users_referrals.update(
      {
        referred: data.referred,
        applied: data.applied,
      },
      { where: { id: userReferralId } },
    );
  };

  const getByUserId = async (userId) => {
    const userReferrals = await Model.users_referrals.findAll({ where: { user_id: userId }, include: Model.referrals });
    const userReferralGroups = []; // { key: string; type: string; credit: number; steps: number; completedSteps: number; }

    userReferrals.forEach((userReferral) => {
      const userReferralGroup = userReferralGroups.find((group) => group.key === userReferral.referral.key);

      if (userReferralGroup) {
        userReferralGroup.completedSteps += userReferral.applied ? 1 : 0;
        userReferralGroup.steps += 1;
      } else {
        userReferralGroups.push({
          key: userReferral.referral.key,
          type: userReferral.referral.type,
          credit: userReferral.referral.credit,
          completedSteps: userReferral.applied ? 1 : 0,
          steps: 1,
        });
      }
    });

    return userReferralGroups.map((group) => ({
      ...group,
      isCompleted: group.completedSteps === group.steps,
    }));
  };

  const hasReferralsProgram = async (user, networkUser, networkPassword) => {
    const appSumoDetails = await App.services.AppSumo.GetDetails(user.id).catch(() => null);

    return (
      !appSumoDetails &&
      !(await App.services.Plan.hasBeenIndividualSubscribedAnyTime(user, networkUser, networkPassword))
    );
  };

  const redeemUserReferral = async (uuid, userId, type, credit) => {
    const { GATEWAY_USER, GATEWAY_PASS } = process.env;

    if (type === 'storage') {
      if (GATEWAY_USER && GATEWAY_PASS) {
        await App.services.Inxt.addStorageByUUID(uuid, credit);
      } else {
        App.logger.warn(
          '(usersReferralsService.redeemUserReferral) GATEWAY_USER\
           || GATEWAY_PASS not found. Skipping storage increasing',
        );
      }
    }

    App.logger.info(
      `(usersReferralsService.redeemUserReferral)\
       The user '${uuid}' (id: ${userId}) has redeemed a referral: ${type} - ${credit}`,
    );
  };

  const applyUserReferral = async (userId, referralKey, referred) => {
    const referral = await App.services.Referrals.getByKey(referralKey);
    const user = await App.services.User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (!referral) {
      throw new Error('Referral not found');
    }

    const userReferral = await Model.users_referrals.findOne({
      where: { user_id: userId, referral_id: referral.id, applied: false },
    });
    if (!userReferral) {
      return;
    }

    const userHasReferralsProgram = await hasReferralsProgram(user, user.bridgeUser, user.userId);
    if (!userHasReferralsProgram) {
      throw new ReferralsNotAvailableError();
    }

    await update({ referred, applied: true }, userReferral.id);
    await redeemUserReferral(user.uuid, userId, referral.type, referral.credit);

    AnalyticsService.trackReferralRedeemed(userId, referralKey);
  };

  return {
    Name: 'UsersReferrals',
    createUserReferrals,
    getByUserId,
    applyUserReferral,
    hasReferralsProgram,
    redeemUserReferral,
  };
};
