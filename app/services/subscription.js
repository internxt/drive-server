module.exports = (Model, App) => {

    const Find = () => {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await Model.subscription.findAll({ raw: true });
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });

    }

    return {
        Name: 'Subscription',
        Find
    }
}