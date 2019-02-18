module.exports = (Model, App) => {

    const Find = () => {
        return new Promise(async (resolve, reject) => {

            try {
                var result = await Model.subscriptions.findOne({
                    raw: true
                });
                resolve(result);
            } catch (error) {
                reject(error);
            }

        });
    }

    return {
        name: 'Subscription',
        Find
    }
}