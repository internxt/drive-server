const storageBought = {
  49: 214748364800, // 200GB
  99: 1099511627776 // 1TB
};

const maxTimesRedemption = 1;

function couponBytes(code) {
  if (!code) {
    return null;
  }
  const dealifyProduct = code.slice(-2);
  return storageBought[dealifyProduct];
}

module.exports = {
  couponBytes,
  maxTimesRedemption
};
