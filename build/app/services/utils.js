"use strict";
var getNewMoveName = function (originalName, i) { return originalName + " (" + i + ")"; };
module.exports = function () {
    var IsBucketId = function (targetId) {
        var bucketIdPattern = /^[a-z0-9]{24}$/;
        var isString = typeof targetId === 'string';
        return isString && !!bucketIdPattern.exec(targetId);
    };
    var IsDatabaseId = function (targetId) {
        var isString = typeof targetId === 'string';
        var isNumber = typeof targetId === 'number';
        var isValidDatabaseId = false;
        if (IsBucketId(targetId)) {
            isValidDatabaseId = false;
        }
        else if (isString) {
            isValidDatabaseId = !!/^[0-9]+$/.exec(targetId);
        }
        else if (isNumber && targetId <= Number.MAX_SAFE_INTEGER) {
            isValidDatabaseId = !!/^[0-9]+$/.exec(targetId.toString());
        }
        else {
            isValidDatabaseId = false;
        }
        return isValidDatabaseId;
    };
    var FileNameParts = function (filename) {
        var pattern = /^(\.?.*?\.?)(\.([^.]*))?$/;
        var matches = filename.match(pattern);
        return { name: matches[1], ext: matches[3] ? matches[3] : null };
    };
    return {
        Name: 'Utils',
        IsBucketId: IsBucketId,
        IsDatabaseId: IsDatabaseId,
        FileNameParts: FileNameParts,
        getNewMoveName: getNewMoveName
    };
};
