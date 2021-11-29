const build = (Service) => async (req, res, next) => {
  try {
    const { user } = req;
    const isGuest = user.email !== user.bridgeUser;

    if (!isGuest) {
      req.behalfUser = req.user;
    } else {
      req.behalfUser = await Service.Guest.getHost(user.bridgeUser);
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  build,
};
