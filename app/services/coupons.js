const Dealify = require('../integrations/dealify/dealify');

module.exports = (Model) => {
  const Integrations = {
    dealify: Dealify
  };
  // const analytics = AnalyticsService(Model, App);

  const findCouponByCode = (code) => Model.coupon.findByPk(code);

  const redeemCoupon = (coupon, email) => {
    coupon.times_reedemed += 1;
    coupon.email = email;

    return coupon.save();
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
      return integration.couponBytes(couponToReedem.code);
    }
  };

  return {
    applyCoupon
  };
};
