module.exports = (Model, App) => {
  const logger = App.logger;

  const IsBucketId = (targetId) => {
    const bucketIdPattern = /^[a-z0-9]{24}$/
    const isString = typeof targetId === 'string'
    return isString && !!bucketIdPattern.exec(targetId)
  }

  const IsDatabaseId = (targetId) => {
    const isString = typeof targetId === 'string'
    const isNumber = typeof targetId === 'number'

    let isValidDatabaseId = false

    if (IsBucketId(targetId)) {
      isValidDatabaseId = false
    } else if (isString) {
      isValidDatabaseId = !!(/^[0-9]+$/.exec(targetId))
    } else if (isNumber && targetId <= Number.MAX_SAFE_INTEGER) {
      isValidDatabaseId = !!(/^[0-9]+$/.exec(targetId.toString()))
    } else {
      isValidDatabaseId = false
    }

    return isValidDatabaseId
  }

  return {
    Name: 'Utils',
    IsBucketId,
    IsDatabaseId
  };
};
