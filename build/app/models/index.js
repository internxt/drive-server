"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var album_1 = __importDefault(require("./album"));
var appsumo_1 = __importDefault(require("./appsumo"));
var backup_1 = __importDefault(require("./backup"));
var device_1 = __importDefault(require("./device"));
var file_1 = __importDefault(require("./file"));
var folder_1 = __importDefault(require("./folder"));
var invitation_1 = __importDefault(require("./invitation"));
var keyserver_1 = __importDefault(require("./keyserver"));
var photo_1 = __importDefault(require("./photo"));
var plan_1 = __importDefault(require("./plan"));
var preview_1 = __importDefault(require("./preview"));
var share_1 = __importDefault(require("./share"));
var team_1 = __importDefault(require("./team"));
var teaminvitation_1 = __importDefault(require("./teaminvitation"));
var teammember_1 = __importDefault(require("./teammember"));
var user_1 = __importDefault(require("./user"));
var userphotos_1 = __importDefault(require("./userphotos"));
var referral_1 = __importDefault(require("./referral"));
var userReferral_1 = __importDefault(require("./userReferral"));
exports.default = (function (database) {
    var _a;
    var Album = (0, album_1.default)(database);
    var AppSumo = (0, appsumo_1.default)(database);
    var Backup = (0, backup_1.default)(database);
    var Device = (0, device_1.default)(database);
    var File = (0, file_1.default)(database);
    var Folder = (0, folder_1.default)(database);
    var Invitation = (0, invitation_1.default)(database);
    var KeyServer = (0, keyserver_1.default)(database);
    var Photo = (0, photo_1.default)(database);
    var Plan = (0, plan_1.default)(database);
    var Preview = (0, preview_1.default)(database);
    var Share = (0, share_1.default)(database);
    var Team = (0, team_1.default)(database);
    var TeamMember = (0, teammember_1.default)(database);
    var TeamInvitation = (0, teaminvitation_1.default)(database);
    var User = (0, user_1.default)(database);
    var UserPhotos = (0, userphotos_1.default)(database);
    var Referral = (0, referral_1.default)(database);
    var UserReferral = (0, userReferral_1.default)(database);
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
    User.belongsToMany(Referral, { through: UserReferral });
    UserPhotos.belongsTo(User, { foreignKey: 'userId' });
    UserPhotos.hasMany(Photo, { foreignKey: 'userId' });
    Referral.belongsToMany(User, { through: UserReferral });
    UserReferral.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });
    UserReferral.belongsTo(Referral, { foreignKey: 'referral_id', targetKey: 'id' });
    return _a = {},
        _a[Album.name] = Album,
        _a[AppSumo.name] = AppSumo,
        _a[Backup.name] = Backup,
        _a[Device.name] = Device,
        _a[File.name] = File,
        _a[Folder.name] = Folder,
        _a[Invitation.name] = Invitation,
        _a[KeyServer.name] = KeyServer,
        _a[Photo.name] = Photo,
        _a[Plan.name] = Plan,
        _a[Preview.name] = Preview,
        _a[Share.name] = Share,
        _a[Team.name] = Team,
        _a[TeamMember.name] = TeamMember,
        _a[TeamInvitation.name] = TeamInvitation,
        _a[User.name] = User,
        _a[UserPhotos.name] = UserPhotos,
        _a[Referral.name] = Referral,
        _a[UserReferral.name] = UserReferral,
        _a;
});
