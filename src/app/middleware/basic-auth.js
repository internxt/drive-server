const build = (user, pass) => (req, res, next) => {
  const receivedAuth = req.headers.authorization;
  const auth = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;

  if (receivedAuth !== auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
};

module.exports = {
  build,
};
