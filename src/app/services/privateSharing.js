class PrivateSharingFolderRoleNotFound extends Error {
  constructor() {
    super('Role inside this resource not found');

    Object.setPrototypeOf(this, PrivateSharingFolderRoleNotFound.prototype);
  }
}

class PrivateSharingFolderPermissionsNotFound extends Error {
  constructor() {
    super('Permissions inside this resource not found');

    Object.setPrototypeOf(this, PrivateSharingFolderPermissionsNotFound.prototype);
  }
}

module.exports = (Model) => {
  const FindUserPermissionsInsidePrivateSharing = async (sharedWithId, folderId) => {
    const privateFolderRole = await Model.privateSharingFolderRoles.find({
      userId: sharedWithId,
      folderId,
    });

    if (!privateFolderRole) {
      throw new PrivateSharingFolderRoleNotFound();
    }

    const permissions = await Model.permissions.find({
      roleId: privateFolderRole.roleId
    });

    if (!permissions) {
      throw new PrivateSharingFolderPermissionsNotFound();
    }

    return permissions;
  };

  const CanUserPerformAction = async (sharedWith, resourceId, action) => {
    const permissions = await FindUserPermissionsInsidePrivateSharing(sharedWith.uuid, resourceId);

    return permissions.includes(action);
  };

  return {
    Name: 'PrivateSharing',
    CanUserPerformAction
  };
};
