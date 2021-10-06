module.exports = (Model) => {
  const enableShareWorkspace = (user, guest, key) => {
    user.tempKey = key;
    return user.save();
  };

  const getHost = (email) => {
    return Model.users.findOne({ where: { email } });
  };

  return {
    Name: 'Guest',
    getHost,
    enableShareWorkspace
  };
};
