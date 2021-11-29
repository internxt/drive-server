module.exports = (Model) => {
  const create = async (data) => {
    return Model.referrals.create({
      key: data.key,
      type: data.type,
      credit: data.credit,
      steps: data.steps,
      start_date: data.start_date,
      expiration_date: data.expiration_date,
    });
  };

  const getAllEnabled = () => {
    return Model.referrals.findAll({ where: { enabled: true } });
  };

  const getByKey = (key) => {
    return Model.referrals.findOne({ where: { key } });
  };

  return {
    Name: 'Referrals',
    create,
    getAllEnabled,
    getByKey,
  };
};
