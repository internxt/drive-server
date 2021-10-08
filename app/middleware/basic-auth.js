const build = (user, pass) => (req, res, next) => {
  if (!req.auth || req.auth.user !== user || req.auth.pass !== pass) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
};

module.exports = {
  build
};