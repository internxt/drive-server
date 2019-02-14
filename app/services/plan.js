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

    return {
        Name: 'Plan',
        ListAll
    }
}