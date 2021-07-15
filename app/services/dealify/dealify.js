const { dealify99, dealify49 } = require('./dealifyProducts');

module.exports = function couponSpace(coupon) {
  if (!coupon) {
    return null;
  }
  const dealifyProduct = coupon.slice(-2);
  let maxSpaceBytes = null;
  if (dealifyProduct === '49' && dealify49.includes(coupon)) {
    maxSpaceBytes = 214748364800; // 200 GB
  } else if (dealifyProduct === '99' && dealify99.includes(coupon)) {
    maxSpaceBytes = 1099511627776; // 1TB
  }
  return maxSpaceBytes;
};
