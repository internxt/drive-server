const sequelize = require('sequelize');

const { Op } = sequelize;

module.exports = (Model) => {
  const create = async (data) => {
    return Model.referrals
      .create({
        key: data.key,
        type: data.type,
        credit: data.credit,
        steps: data.steps,
        start_date: data.start_date,
        expiration_date: data.expiration_date
      });
  };

  const createUserReferrals = async (userId) => {
    const referrals = await Model.referrals.findAll({ where: { enabled: { [Op.eq]: true } } });
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

  const getByUserId = async (userId) => {
    return Model.users_referrals.findAll({ where: { user_id: { [Op.eq]: userId } } });
  };

  const redeemUserReferral = async (userReferral) => {
    if (userReferral.type === 'storage') {
      // TODO: call bridge increase storage endpoint
    }
  };

  const updateUserReferral = async (data, userReferralId) => {
    const updatedUserReferral = await Model.users_referrals
      .update({
        referred: data.referred,
        applied: data.applied
      }, { where: { id: { [Op.eq]: userReferralId } }, returning: true, plain: true });

    if (data.applied) {
      await redeemUserReferral(updatedUserReferral);
    }
  };

  return {
    Name: 'Referrals',
    create,
    createUserReferrals,
    getByUserId,
    updateUserReferral
  };
};
