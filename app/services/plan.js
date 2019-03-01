module.exports = (Model, App) => {
    const ListAll = () => {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await Model.plans.findAll({ raw: true });
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });

    }

    const FindPlanByStripeCode = (stripeCode) => {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await Model.plans.findOne({
                    raw: true,
                    where: {
                        stripe_plan_id: stripeCode
                    }
                });
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    const GetUserUsage = (user) => {
        return new Promise(async (resolve, reject) => {
            try {
                fetch('https://api.internxt.com/usage', {

                }).then(result => {
                    resolve(result);
                }).catch(error => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    return {
        Name: 'Plan',
        ListAll,
        FindPlanByStripeCode,
        GetUserUsage
    }
}