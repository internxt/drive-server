const { default: axios } = require('axios');
const Dealify = require('../integrations/dealify/dealify');
const { FREE_PLAN_BYTES } = require('./constants');

module.exports = (Model, App) => {
  const Logger = App.logger;
  const Integrations = {
    dealify: Dealify
  };

  const findCouponByCode = (code) => Model.coupon.findByPk(code);

  const redeemCoupon = (coupon, email) => {
    coupon.times_reedemed += 1;
    coupon.email = email;

    return coupon.save();
  };

  const applySpace = (coupon, bytes = FREE_PLAN_BYTES) => {
    const { GATEWAY_USER, GATEWAY_PASS } = process.env;

    return axios.post(`${process.env.STORJ_BRIDGE}/gateway/upgrade`, {
      email: coupon.email,
      bytes
    }, {
      headers: { 'Content-Type': 'application/json' },
      auth: { username: GATEWAY_USER, password: GATEWAY_PASS }
    }).then(() => {
      Logger.info(`Coupon Redeemed: ${coupon.code}, For user: ${coupon.email}`);
    })
      .catch(() => {
        throw Error(`Couldn't redeem coupon: ${coupon.code}, For user: ${coupon.email}`);
      });
  };

  const applyCoupon = async (coupon) => {
    const { code, partner, email } = coupon;
    const couponToReedem = await findCouponByCode(code);
    const integration = Integrations[partner];

    if (!couponToReedem) {
      // Error Coupon Invalid, misspelled
      throw Error(`Coupon code misspelled ${code}`);
    } else if (couponToReedem.times_reedemed > 0 && couponToReedem.times_reedemed >= integration.maxTimesRedemption) {
      // Coupon Already reedemed
      throw Error(`Coupon already redeemed. Coupon code: ${code}`);
    } else if (couponToReedem.times_reedemed < integration.maxTimesRedemption) {
      await redeemCoupon(couponToReedem, email);
      const maxSpaceBytes = integration.couponBytes(couponToReedem.code) || FREE_PLAN_BYTES;
      return maxSpaceBytes;
    }
  };

  return {
    applyCoupon,
    applySpace
  };
};
