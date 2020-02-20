module.exports = (Model, App) => {
  const Insert = (payload) => {
    return new Promise(async (resolve, reject) => {
      Model.statistics.create(payload).then(resolve).catch(reject)
    });
  }

  return {
    Name: 'Statistics',
    Insert
  }
}
