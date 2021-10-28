const sequelize = require('sequelize');

const { Op } = sequelize;

module.exports = (Model) => {
  const create = async (data) => {
    return Model.referrals
      .create({
        key: data.key,
        type: data.type,
        credit: data.credit,
        target_value: data.target_value,
        start_date: data.start_date,
        expiration_date: data.expiration_date
      });
  };

  const createUserReferral = async (data) => {
    return Model.users_referrals
      .create({
        user_id: data.user_id,
        referral_id: data.referral_id,
        referred_id: data.referred_id
      });
  };

  const getByUserId = async (userId) => {
    return Model.users_referrals.findAll({ where: { user_id: { [Op.eq]: userId } } });
  };

  const updateUserReferral = async (data, userReferralId) => {
    return Model.users_referrals
      .update({
        current_value: data.current_value
      }, { where: { id: { [Op.eq]: userReferralId } } });
  };

  return {
    Name: 'Referrals',
    create,
    createUserReferral,
    getByUserId,
    updateUserReferral
  };
};
