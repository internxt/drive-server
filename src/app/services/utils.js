const getNewMoveName = (originalName, i) => `${originalName} (${i})`;

module.exports = () => {
  const IsBucketId = (targetId) => {
    const bucketIdPattern = /^[a-z0-9]{24}$/;
    const isString = typeof targetId === 'string';
    return isString && !!bucketIdPattern.exec(targetId);
  };

  const IsDatabaseId = (targetId) => {
    const isString = typeof targetId === 'string';
    const isNumber = typeof targetId === 'number';

    let isValidDatabaseId = false;

    if (IsBucketId(targetId)) {
      isValidDatabaseId = false;
    } else if (isString) {
      isValidDatabaseId = !!/^[0-9]+$/.exec(targetId);
    } else if (isNumber && targetId <= Number.MAX_SAFE_INTEGER) {
      isValidDatabaseId = !!/^[0-9]+$/.exec(targetId.toString());
    } else {
      isValidDatabaseId = false;
    }

    return isValidDatabaseId;
  };

  const FileNameParts = (filename) => {
    const pattern = /^(\.?.*?\.?)(\.([^.]*))?$/;
    const matches = filename.match(pattern);

    return { name: matches[1], ext: matches[3] ? matches[3] : null };
  };

  return {
    Name: 'Utils',
    IsBucketId,
    IsDatabaseId,
    FileNameParts,
    getNewMoveName
  };
};
