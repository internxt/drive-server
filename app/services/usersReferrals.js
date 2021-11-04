const sequelize = require('sequelize');
const createHttpError = require('http-errors');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const createUserReferrals = async (userId) => {
    const referrals = await App.services.Referrals.getAllEnabled();
    const userReferralsToCreate = [];

    referrals.forEach((referral) => {
      const applied = referral.key === 'create-account';

      Array(referral.steps).fill().forEach(() => {
        userReferralsToCreate.push({
          user_id: userId,
          referral_id: referral.id,
          start_date: new Date(),
          applied
        });
      });
    });

    await Model.users_referrals.bulkCreate(
      userReferralsToCreate, { individualHooks: true, fields: ['user_id', 'referral_id', 'start_date', 'applied'] }
    );
  };

  const update = async (data, userReferralId) => {
    return Model.users_referrals
      .update({
        referred: data.referred,
        applied: data.applied
      }, { where: { id: { [Op.eq]: userReferralId } } });
  };

  const getByUserId = async (userId) => {
    const userReferrals = await Model.users_referrals.findAll({ where: { user_id: userId }, include: Model.referrals });
    const userReferralGroups = []; // { key: string; type: string; credit: number; steps: number; completedSteps: number; }

    userReferrals.forEach((userReferral) => {
      const userReferralGroup = userReferralGroups.find((group) => group.key === userReferral.referral.key);

      if (userReferralGroup) {
        userReferralGroup.completedSteps += userReferral.applied ? 1 : 0;
      } else {
        userReferralGroups.push({
          key: userReferral.referral.key,
          type: userReferral.referral.type,
          credit: userReferral.referral.credit,
          steps: userReferral.referral.steps,
          completedSteps: userReferral.applied ? 1 : 0
        });
      }
    });

    return userReferralGroups.map((group) => ({
      ...group,
      isCompleted: group.steps === group.completedSteps
    }));
  };

  const hasReferralsProgram = async (userEmail, userId) => {
    return !(await App.services.Plan.hasBeenIndividualSubscribedAnyTime(userEmail, userId));
  };

  const redeemUserReferral = async (userEmail, userId, type, credit) => {
    if (type === 'storage') {
      // TODO: call bridge increase storage endpoint
    }

    App.logger.info(
      `(usersReferralsService.redeemUserReferral) The user '${userEmail}' (id: ${userId}) has redeemed a referral: ${type} - ${credit}`
    );
  };

  const applyReferral = async (userEmail, userId, referralKey, referred) => {
    const referral = await App.services.Referrals.getByKey(referralKey);
    if (!referral) {
      throw createHttpError(500, `(usersReferralsService.applyReferral) referral with key '${referralKey}' not found`);
    }

    const userReferral = await Model.users_referrals.findOne({ where: { user_id: userId, referral_id: referral.id, applied: false } });
    if (!userReferral) {
      return;
    }

    const userHasReferralsProgram = await hasReferralsProgram(userEmail, userId);
    if (!userHasReferralsProgram) {
      throw createHttpError(403, '(usersReferralsService.applyReferral) referrals program not enabled for this user');
    }

    await update({ referred, applied: true }, userReferral.id);
    await redeemUserReferral(userEmail, userId, referral.type, referral.credit);
  };

  return {
    Name: 'UsersReferrals',
    createUserReferrals,
    getByUserId,
    applyReferral,
    hasReferralsProgram
  };
};
