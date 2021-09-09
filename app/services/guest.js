module.exports = () => {
  const enableShareWorkspace = (user, guest, key) => {
    user.tempKey = key;
    return user.save();
  };

  return {
    Name: 'Guest',
    enableShareWorkspace
  };
};
