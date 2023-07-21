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
import initTeam, { TeamModel } from './team';
import initTeamInvitation, { TeamInvitationModel } from './teaminvitation';
import initTeamMember, { TeamMemberModel } from './teammember';
import initThumbnail, { ThumbnailModel } from './thumbnail';
import initUser, { UserModel } from './user';
import initUserReferral, { UserReferralModel } from './userReferral';
import initLookUp, { LookUpModel } from './lookup';

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
  | TeamModel
  | TeamInvitationModel
  | TeamMemberModel
  | UserModel
  | UserReferralModel
  | FriendInvitationModel
  | LookUpModel;

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
  const Team = initTeam(database);
  const TeamMember = initTeamMember(database);
  const TeamInvitation = initTeamInvitation(database);
  const User = initUser(database);
  const UserReferral = initUserReferral(database);
  const FriendInvitation = initFriendInvitation(database);
  const LookUp = initLookUp(database);

  AppSumo.belongsTo(User);

  Backup.belongsTo(Device);
  Backup.belongsTo(User);

  Device.belongsTo(User);
  Device.hasMany(Backup);

  File.belongsTo(Folder);
  File.belongsTo(User);
  File.hasMany(Share, { as: 'shares', foreignKey: 'file_id', sourceKey: 'id' });
  File.hasMany(Thumbnail);
  File.hasOne(LookUp, { sourceKey: 'uuid', foreignKey: 'item_id '});

  Thumbnail.belongsTo(File, { foreignKey: 'file_id', targetKey: 'id' });

  Folder.hasMany(File);
  Folder.belongsTo(User);
  Folder.hasMany(Folder, { foreignKey: 'parent_id', as: 'children' });
  Folder.hasMany(Share, { as: 'shares', foreignKey: 'folder_id', sourceKey: 'id' });
  Folder.hasOne(LookUp, { sourceKey: 'uuid', foreignKey: 'item_id' });

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
  User.hasMany(LookUp, { sourceKey: 'uuid', foreignKey: 'user_id' });

  UserReferral.belongsTo(User, { foreignKey: 'user_id' });
  UserReferral.belongsTo(Referral, { foreignKey: 'referral_id' });

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
    [Team.name]: Team,
    [TeamMember.name]: TeamMember,
    [TeamInvitation.name]: TeamInvitation,
    [User.name]: User,
    [UserReferral.name]: UserReferral,
    [FriendInvitation.name]: FriendInvitation,
    ['lookUp']: LookUp
  };
};
