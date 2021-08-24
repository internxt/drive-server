module.exports = () => {
  const isProduction = () => {
    return process.env.NODE_ENV === 'production';
  };

  return {
    Name: 'Env',
    isProduction
  };
};
