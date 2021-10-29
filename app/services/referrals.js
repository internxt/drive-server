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

    const result = await Model.users_referrals.bulkCreate(userReferralsToCreate, { returning: true, individualHooks: true });

    console.log(result);
  };

  const getByUserId = async (userId) => {
    return Model.users_referrals.findAll({ where: { user_id: { [Op.eq]: userId } } });
  };

  const updateUserReferral = async (data, userReferralId) => {
    return Model.users_referrals
      .update({
        referred: data.referred,
        applied: data.applied
      }, { where: { id: { [Op.eq]: userReferralId } } });
  };

  return {
    Name: 'Referrals',
    create,
    createUserReferrals,
    getByUserId,
    updateUserReferral
  };
};
