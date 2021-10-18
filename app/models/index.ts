import { AlbumModel } from './album';
import { AppSumoModel } from './appsumo';
import { BackupModel } from './backup';
import { DeviceModel } from './device';
import { FileModel } from './file';
import { FolderModel } from './folder';
import { InvitationModel } from './invitation';
import { KeyServerModel } from './keyserver';
import { PhotoModel } from './photo';
import { PlanModel } from './plan';
import { PreviewModel } from './preview';
import { ShareModel } from './share';
import { TeamModel } from './teams';
import { TeamInvitationModel } from './teamsinvitations';
import { TeamsMembersModel } from './teamsmembers';
import { UserModel } from './user';
import { UserPhotosModel } from './userphotos';

export type DatabaseModel = AlbumModel
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
| TeamsMembersModel
| UserModel
| UserPhotosModel;

// const models:  = new Map<string, DatabaseModel>();

// DatabaseModels.put('appsumo', )
