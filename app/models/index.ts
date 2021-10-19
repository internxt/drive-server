import { Sequelize } from 'sequelize';

import initAlbum, { AlbumModel } from './album';
import initAppSumo, { AppSumoModel } from './appsumo';
import initBackup, { BackupModel } from './backup';
import initDevice, { DeviceModel } from './device';
import initFile, { FileModel } from './file';
import initFolder, { FolderModel } from './folder';
import initInvitation, { InvitationModel } from './invitation';
import initKeyServer, { KeyServerModel } from './keyserver';
import initPhoto, { PhotoModel } from './photo';
import initPlan, { PlanModel } from './plan';
import initPreview, { PreviewModel } from './preview';
import initShare, { ShareModel } from './share';
import initTeam, { TeamModel } from './team';
import initTeamInvitation, { TeamInvitationModel } from './teaminvitation';
import initTeamMember, { TeamMemberModel } from './teammember';
import initUser, { UserModel } from './user';
import initUserPhotos, { UserPhotosModel } from './userphotos';

export type ModelType = AlbumModel
  | AppSumoModel
  | BackupModel
  | DeviceModel
  | FileModel 
  | FolderModel
  | InvitationModel
  | KeyServerModel
  | PhotoModel
  | PlanModel
  | PreviewModel
  | ShareModel
  | TeamModel
  | TeamInvitationModel
  | TeamMemberModel
  | UserModel
  | UserPhotosModel;


export default (database: Sequelize) => {
  const Album = initAlbum(database);
  const AppSumo = initAppSumo(database);
  const Backup = initBackup(database);
  const Device = initDevice(database);
  const File = initFile(database);
  const Folder = initFolder(database);
  const Invitation = initInvitation(database);
  const KeyServer = initKeyServer(database);
  const Photo = initPhoto(database);
  const Plan = initPlan(database);
  const Preview = initPreview(database);
  const Share = initShare(database);
  const Team = initTeam(database);
  const TeamMember = initTeamMember(database);
  const TeamInvitation = initTeamInvitation(database);
  const User = initUser(database);
  const UserPhotos = initUserPhotos(database);

  Album.belongsToMany(Photo, { through: 'photosalbums' });
  Album.belongsTo(UserPhotos, { foreignKey: 'userId' });

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

  Photo.belongsToMany(Album, { through: 'photosalbums' });
  Photo.hasOne(UserPhotos, { foreignKey: 'userId' });
  Photo.hasOne(Preview);

  Plan.belongsTo(User);

  Preview.belongsTo(Photo, { foreignKey: 'photoId' });

  Share.hasOne(File, { as: 'fileInfo', foreignKey: 'fileId', sourceKey: 'file' });

  User.hasMany(Folder);
  User.hasMany(File);
  User.hasOne(UserPhotos);
  User.hasOne(AppSumo);
  User.hasOne(KeyServer);
  User.hasOne(Plan);
  User.hasMany(Device);
  User.hasMany(Invitation, { foreignKey: 'host' });

  UserPhotos.belongsTo(User, { foreignKey: 'userId' });
  UserPhotos.hasMany(Photo, { foreignKey: 'userId' });

  return {
    [Album.name]: Album,
    [AppSumo.name]: AppSumo,
    [Backup.name]: Backup,
    [Device.name]: Device,
    [File.name]: File,
    [Folder.name]: Folder,
    [Invitation.name]: Invitation,
    [KeyServer.name]: KeyServer,
    [Photo.name]: Photo,
    [Plan.name]: Plan,
    [Preview.name]: Preview,
    [Share.name]: Share,
    [Team.name]: Team,
    [TeamMember.name]: TeamMember,
    [TeamInvitation.name]: TeamInvitation,
    [User.name]: User,
    [UserPhotos.name]: UserPhotos
  }
}
