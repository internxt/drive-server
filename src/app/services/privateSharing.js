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
  const FindUserPermissionsInsidePrivateSharing = async (sharedWithId, itemId) => {
    const permissions = await Model.permissions.findAll({
      include: [
        {
          model: Model.sharingRoles,
          include: [
            {
              model: Model.sharings,
              where: {
                sharedWith: sharedWithId,
                itemId,
              }
            }
          ]
        }
      ]
    });

    if (!permissions) {
      throw new PrivateSharingFolderPermissionsNotFound();
    }

    return permissions;
  };

  const CanUserPerformAction = async (sharedWith, resourceId, action) => {
    const permissions = await FindUserPermissionsInsidePrivateSharing(sharedWith.uuid, resourceId);

    for (const permission of permissions) {
      if (permission.type === action) {
        return true;
      }
    }
    return false;
  };

  return {
    Name: 'PrivateSharing',
    CanUserPerformAction
  };
};
