import { Sequelize } from 'sequelize';

import initAppSumo, { AppSumoModel } from './appsumo';
import initBackup, { BackupModel } from './backup';
import initDevice, { DeviceModel } from './device';
import initFile, { FileModel } from './file';
import initFolder, { FolderModel } from './folder';
import initInvitation, { InvitationModel } from './invitation';
import initKeyServer, { KeyServerModel } from './keyserver';
import initPlan, { PlanModel } from './plan';
import initShare, { ShareModel } from './share';
import initTeam, { TeamModel } from './team';
import initTeamInvitation, { TeamInvitationModel } from './teaminvitation';
import initTeamMember, { TeamMemberModel } from './teammember';
import initUser, { UserModel } from './user';
import initReferral, { ReferralModel } from './referral';
import initUserReferral, { UserReferralModel } from './userReferral';

export type ModelType =
  | AppSumoModel
  | BackupModel
  | DeviceModel
  | FileModel
  | FolderModel
  | InvitationModel
  | KeyServerModel
  | PlanModel
  | ShareModel
  | TeamModel
  | TeamInvitationModel
  | TeamMemberModel
  | UserModel
  | ReferralModel
  | UserReferralModel;

export default (database: Sequelize) => {
  const AppSumo = initAppSumo(database);
  const Backup = initBackup(database);
  const Device = initDevice(database);
  const File = initFile(database);
  const Folder = initFolder(database);
  const Invitation = initInvitation(database);
  const KeyServer = initKeyServer(database);
  const Plan = initPlan(database);
  const Share = initShare(database);
  const Team = initTeam(database);
  const TeamMember = initTeamMember(database);
  const TeamInvitation = initTeamInvitation(database);
  const User = initUser(database);
  const Referral = initReferral(database);
  const UserReferral = initUserReferral(database);

  AppSumo.belongsTo(User);

  Backup.belongsTo(Device);
  Backup.belongsTo(User);

  Device.belongsTo(User);
  Device.hasMany(Backup);

  File.belongsTo(Folder);
  File.belongsTo(User);
  File.hasMany(Share, { as: 'shares', foreignKey: 'file', sourceKey: 'fileId' });

  Folder.hasMany(File);
  Folder.belongsTo(User);
  Folder.hasMany(Folder, { foreignKey: 'parent_id', as: 'children' });

  Invitation.belongsTo(User, { foreignKey: 'host', targetKey: 'id' });
  Invitation.belongsTo(User, { foreignKey: 'guest', targetKey: 'id' });

  Plan.belongsTo(User);

  Share.hasOne(File, { as: 'fileInfo', foreignKey: 'fileId', sourceKey: 'file' });

  User.hasMany(Folder);
  User.hasMany(File);
  User.hasOne(AppSumo);
  User.hasOne(KeyServer);
  User.hasOne(Plan);
  User.hasMany(Device);
  User.hasMany(Invitation, { foreignKey: 'host' });
  User.belongsToMany(Referral, { through: UserReferral });

  Referral.belongsToMany(User, { through: UserReferral });

  UserReferral.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
  UserReferral.belongsTo(Referral, { foreignKey: 'referral_id', targetKey: 'id' });

  return {
    [AppSumo.name]: AppSumo,
    [Backup.name]: Backup,
    [Device.name]: Device,
    [File.name]: File,
    [Folder.name]: Folder,
    [Invitation.name]: Invitation,
    [KeyServer.name]: KeyServer,
    [Plan.name]: Plan,
    [Share.name]: Share,
    [Team.name]: Team,
    [TeamMember.name]: TeamMember,
    [TeamInvitation.name]: TeamInvitation,
    [User.name]: User,
    [Referral.name]: Referral,
    [UserReferral.name]: UserReferral,
  };
};
