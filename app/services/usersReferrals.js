const sequelize = require('sequelize');
const createHttpError = require('http-errors');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const createUserReferrals = async (userId) => {
    const referrals = await App.services.Referrals.getAllEnabled();
    const userReferralsToCreate = [];

    referrals.forEach((referral) => {
      Array(referral.steps).forEach(() => {
        userReferralsToCreate.push({
          user_id: userId,
          referral_id: referral.id
        });
      });
    });

    await Model.users_referrals.bulkCreate(userReferralsToCreate, { returning: true, individualHooks: true });
  };

  const redeemUserReferral = async (userId, type, credit) => {
    if (type === 'storage') {
      // TODO: call bridge increase storage endpoint
    }

    App.logger.info(`(usersReferralsService.redeemUserReferral) The user '${userId}' has redeemed a referral: ${type} - ${credit}`);
  };

  const update = async (data, userReferralId) => {
    return Model.users_referrals
      .update({
        referred: data.referred,
        applied: data.applied
      }, { where: { id: { [Op.eq]: userReferralId } } });
  };

  const getByUserId = async (userId) => {
    return Model.users_referrals.findAll({ where: { user_id: { [Op.eq]: userId } } });
  };

  const applyReferral = async (userId, referralKey, referred) => {
    const referral = await App.services.Referrals.getByKey(referralKey);

    if (!referral) {
      throw createHttpError(500, `(usersReferralsService.applyReferral) referral with key '${referralKey}' not found`);
    }

    const userReferral = await Model.users_referrals.findOne({ where: { user_id: userId, referral_id: referral.id, applied: false } });

    if (userReferral) {
      await update({ referred, applied: true });
      await redeemUserReferral(userId, referral.type, referral.credit);
    }
  };

  return {
    Name: 'UsersReferrals',
    createUserReferrals,
    getByUserId,
    applyReferral
  };
};
