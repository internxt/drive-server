import { Sequelize } from 'sequelize';

import initAppSumo, { AppSumoModel } from './appsumo';
import initBackup, { BackupModel } from './backup';
import initDevice, { DeviceModel } from './device';
import initFile, { FileModel } from './file';
import initFolder, { FolderModel } from './folder';
import initFriendInvitation, { FriendInvitationModel } from './friendinvitation';
import initInvitation, { InvitationModel } from './invitation';
import initKeyServer, { KeyServerModel } from './keyserver';
import initMailLimit, { MailLimitModel } from './mailLimit';
import initPlan, { PlanModel } from './plan';
import initReferral, { ReferralModel } from './referral';
import initShare, { ShareModel } from './share';
import initThumbnail, { ThumbnailModel } from './thumbnail';
import initUser, { UserModel } from './user';
import initUserReferral, { UserReferralModel } from './userReferral';
import initRole, { RoleModel } from './roles';
import initPermission, { PermissionModel } from './permissions';
import initPrivateSharingFolder, { PrivateSharingFolderModel } from './privateSharingFolder';
import initPrivateSharingFolderRole, { PrivateSharingFolderRoleModel } from './privateSharingFolderRole';
import initSharings, { SharingsModel } from './sharings';
import initSharingInvites, { SharingInvitesModel } from './sharingInvites';
import initSharingRoles, { SharingRolesModel } from './sharingRoles';
import initLimit, { LimitModel } from './limit';
import initTier, { TierModel } from './tier';
import initPaidPlan, { PaidPlansModel } from './paidPlans';
import initTierLimit, { TierLimitsModel } from './tierLimit';
import initUserNotificationTokens, { UserNotificationTokenModel } from './userNotificationTokens';

export type ModelType =
  | AppSumoModel
  | BackupModel
  | DeviceModel
  | FileModel
  | ThumbnailModel
  | FolderModel
  | InvitationModel
  | KeyServerModel
  | MailLimitModel
  | PlanModel
  | ReferralModel
  | ShareModel
  | UserModel
  | UserReferralModel
  | FriendInvitationModel
  | RoleModel
  | PermissionModel
  | PrivateSharingFolderModel
  | PrivateSharingFolderRoleModel
  | SharingsModel
  | SharingInvitesModel
  | SharingRolesModel
  | PaidPlansModel
  | TierLimitsModel
  | LimitModel
  | TierModel
  | UserNotificationTokenModel;

export default (database: Sequelize) => {
  const AppSumo = initAppSumo(database);
  const Backup = initBackup(database);
  const Device = initDevice(database);
  const File = initFile(database);
  const Thumbnail = initThumbnail(database);
  const Folder = initFolder(database);
  const Invitation = initInvitation(database);
  const KeyServer = initKeyServer(database);
  const MailLimit = initMailLimit(database);
  const Plan = initPlan(database);
  const Referral = initReferral(database);
  const Share = initShare(database);
  const User = initUser(database);
  const UserReferral = initUserReferral(database);
  const FriendInvitation = initFriendInvitation(database);
  const Role = initRole(database);
  const Permission = initPermission(database);
  const PrivateSharingFolder = initPrivateSharingFolder(database);
  const PrivateSharingFolderRole = initPrivateSharingFolderRole(database);
  const Sharings = initSharings(database);
  const SharingInvites = initSharingInvites(database);
  const SharingRoles = initSharingRoles(database);
  const Limit = initLimit(database);
  const Tier = initTier(database);
  const PaidPlans = initPaidPlan(database);
  const TierLimit = initTierLimit(database);
  const UserNotificationToken = initUserNotificationTokens(database);

  AppSumo.belongsTo(User);

  Backup.belongsTo(Device);
  Backup.belongsTo(User);

  Device.belongsTo(User);
  Device.hasMany(Backup);

  File.belongsTo(Folder);
  File.belongsTo(User);
  File.hasMany(Share, { as: 'shares', foreignKey: 'file_id', sourceKey: 'id' });
  File.hasMany(Thumbnail);

  Thumbnail.belongsTo(File, { foreignKey: 'file_id', targetKey: 'id' });

  Folder.hasMany(File);
  Folder.belongsTo(User);
  Folder.hasMany(Folder, { foreignKey: 'parent_id', as: 'children' });
  Folder.hasMany(Share, { as: 'shares', foreignKey: 'folder_id', sourceKey: 'id' });
  Folder.hasMany(PrivateSharingFolderRole, { foreignKey: 'folder_id', sourceKey: 'uuid' });
  Folder.hasMany(PrivateSharingFolder, { foreignKey: 'folder_id', sourceKey: 'uuid' });

  Invitation.belongsTo(User, { foreignKey: 'host', targetKey: 'id' });
  Invitation.belongsTo(User, { foreignKey: 'guest', targetKey: 'id' });

  MailLimit.belongsTo(User);

  Plan.belongsTo(User);

  Referral.belongsToMany(User, { through: UserReferral });

  Share.hasOne(File, { as: 'fileInfo', foreignKey: 'id', sourceKey: 'file_id' });
  Share.hasOne(Folder, { as: 'folderInfo', foreignKey: 'id', sourceKey: 'folder_id' });

  User.hasMany(Folder);
  User.hasMany(File);
  User.hasOne(AppSumo);
  User.hasOne(KeyServer);
  User.hasOne(Plan);
  User.hasMany(Device);
  User.hasMany(Invitation, { foreignKey: 'host' });
  User.belongsToMany(Referral, { through: UserReferral });
  User.hasMany(MailLimit, { foreignKey: 'user_id' });
  User.hasMany(FriendInvitation, { foreignKey: 'host' });
  User.hasMany(PrivateSharingFolderRole, { foreignKey: 'user_id', sourceKey: 'uuid' });
  User.hasMany(PrivateSharingFolder, { foreignKey: 'owner_id', sourceKey: 'uuid' });
  User.hasMany(PrivateSharingFolder, { foreignKey: 'shared_with', sourceKey: 'uuid' });
  User.hasMany(Sharings, { foreignKey: 'owner_id', sourceKey: 'uuid' });
  User.hasMany(Sharings, { foreignKey: 'shared_with', sourceKey: 'uuid' });
  User.hasMany(UserNotificationToken, { foreignKey: 'userId', sourceKey: 'uuid' });

  UserReferral.belongsTo(User, { foreignKey: 'user_id' });
  UserReferral.belongsTo(Referral, { foreignKey: 'referral_id' });

  Role.hasMany(Permission, { foreignKey: 'role_id', sourceKey: 'id' });
  Role.hasMany(PrivateSharingFolderRole, { foreignKey: 'role_id', sourceKey: 'id' });
  Role.hasMany(SharingRoles, { foreignKey: 'role_id', sourceKey: 'id' });
  SharingInvites.belongsTo(User, { foreignKey: 'shared_with', targetKey: 'uuid' });

  PrivateSharingFolderRole.belongsTo(Folder, { foreignKey: 'folder_id', targetKey: 'uuid' });
  PrivateSharingFolderRole.belongsTo(User, { foreignKey: 'user_id', targetKey: 'uuid' });
  PrivateSharingFolderRole.belongsTo(Role, { foreignKey: 'role_id', targetKey: 'id' });

  SharingRoles.belongsTo(Sharings, { foreignKey: 'sharing_id', targetKey: 'id' });
  SharingRoles.belongsTo(Role, { foreignKey: 'role_id', targetKey: 'id' });

  Permission.belongsTo(Role, { foreignKey: 'role_id', targetKey: 'id' });

  Sharings.belongsTo(User, { foreignKey: 'owner_id', targetKey: 'uuid' });
  Sharings.belongsTo(User, { foreignKey: 'shared_with', targetKey: 'uuid' });
  Sharings.hasMany(SharingRoles, { foreignKey: 'sharing_id', sourceKey: 'id' });

  SharingInvites.belongsTo(User, { foreignKey: 'shared_with', targetKey: 'uuid' });

  PrivateSharingFolder.belongsTo(Folder, { foreignKey: 'folder_id', targetKey: 'uuid' });
  PrivateSharingFolder.belongsTo(User, { foreignKey: 'owner_id', targetKey: 'uuid' });
  PrivateSharingFolder.belongsTo(User, { foreignKey: 'shared_with', targetKey: 'uuid' });

  PaidPlans.belongsTo(Tier, {
    foreignKey: 'tier_id',
    targetKey: 'id',
  });

  Limit.belongsToMany(Tier, {
    through: TierLimit,
    as: 'tiers',
  });

  UserNotificationToken.belongsTo(User, { foreignKey: 'userId', targetKey: 'uuid' });

  return {
    [AppSumo.name]: AppSumo,
    [Backup.name]: Backup,
    [Device.name]: Device,
    [File.name]: File,
    [Thumbnail.name]: Thumbnail,
    [Folder.name]: Folder,
    [Invitation.name]: Invitation,
    [KeyServer.name]: KeyServer,
    ['mailLimit']: MailLimit,
    [Plan.name]: Plan,
    [Referral.name]: Referral,
    [Share.name]: Share,
    [User.name]: User,
    [UserReferral.name]: UserReferral,
    [FriendInvitation.name]: FriendInvitation,
    [Role.name]: Role,
    [Permission.name]: Permission,
    [PrivateSharingFolder.name]: PrivateSharingFolder,
    [PrivateSharingFolderRole.name]: PrivateSharingFolderRole,
    [Sharings.name]: Sharings,
    [SharingInvites.name]: SharingInvites,
    [SharingRoles.name]: SharingRoles,
    [Tier.name]: Tier,
    [Limit.name]: Limit,
    [PaidPlans.name]: PaidPlans,
    [TierLimit.name]: TierLimit,
    ['userNotificationToken']: UserNotificationToken,
  };
};
