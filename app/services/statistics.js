module.exports = (Model, App) => {
    const Insert = (payload) => {
      return new Promise(async (resolve, reject) => {
        Model.statistics.create(payload).then(result => {
          resolve(result);
        }).catch(err => {
          reject(err)
        })
      });
    }
  
    return {
      Name: 'Statistics',
      Insert
    }
  }
  