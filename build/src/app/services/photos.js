"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var sequelize = require('sequelize');
var Op = sequelize.Op;
var SanitizeFilename = require('sanitize-filename');
module.exports = function (Model, App) {
    var log = App.logger;
    var FindAlbumById = function (albumId, userId) {
        var _a, _b;
        return Model.albums.findOne({
            where: {
                id: (_a = {}, _a[Op.eq] = albumId, _a),
                userId: (_b = {}, _b[Op.eq] = userId, _b)
            }
        });
    };
    var FindPhotoById = function (photosUser, photoId) {
        var _a, _b;
        return Model.photos.findOne({
            where: {
                id: (_a = {}, _a[Op.eq] = photoId, _a),
                userId: (_b = {}, _b[Op.eq] = photosUser.id, _b)
            }
        });
    };
    var FindPhotoByHash = function (photosUser, hash) {
        var _a, _b;
        return Model.photos.findOne({
            where: {
                hash: (_a = {}, _a[Op.eq] = hash, _a),
                userId: (_b = {}, _b[Op.eq] = photosUser.id, _b)
            }
        });
    };
    var CreateAlbum = function (userId, name) { return new Promise(function (resolve, reject) {
        // Prevent strange folder names from being created
        var sanitizedAlbumName = SanitizeFilename(name);
        if (name === '' || sanitizedAlbumName !== name) {
            throw Error('Invalid album name');
        }
        // Encrypt folder name, TODO: use versioning for encryption
        var cryptoAlbumName = App.services.Crypt.encryptName(name, 333);
        return Model.albums.create({
            name: cryptoAlbumName,
            userId: userId
        })
            .catch(function (err) {
            log('Error creating album', err);
            reject(Error('Unable to create album in database'));
        });
    }); };
    var CreatePhoto = function (user, photo) { return new Promise(function (resolve, reject) {
        if (!photo || !photo.id || !photo.size || !photo.name) {
            return reject(new Error('Invalid metadata for new photo'));
        }
        var photoInfo = {
            id: photo.id,
            photoId: null,
            name: photo.name,
            type: photo.type,
            size: photo.size,
            bucketId: user.rootAlbumId,
            userId: user.id
        };
        if (photo.date) {
            photoInfo.createdAt = photo.date;
        }
        return Model.photo
            .create(photoInfo)
            .catch(function (err) {
            log('Error creating entry', err);
            reject(Error('Unable to create photo in database'));
        });
    }); };
    var GetPartialPhotosContent = function (user, userPhotos, hashList) { return __awaiter(void 0, void 0, void 0, function () {
        var result, photos;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, Model.photos.findAll({
                        where: {
                            userId: (_a = {}, _a[Op.eq] = userPhotos.id, _a),
                            hash: (_b = {}, _b[Op.in] = hashList, _b)
                        },
                        include: [
                            {
                                model: Model.previews,
                                as: 'preview'
                            }
                        ]
                    })];
                case 1:
                    result = _c.sent();
                    if (result !== null) {
                        photos = result.map(function (photo) {
                            photo.name = "" + App.services.Crypt.decryptName(photo.name, 111);
                            return photo;
                        });
                        return [2 /*return*/, photos];
                    }
                    return [2 /*return*/, result];
            }
        });
    }); };
    var GetAllPhotosContent = function (user, userPhotos) { return __awaiter(void 0, void 0, void 0, function () {
        var result, photos;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Model.photos.findAll({
                        where: {
                            bucketId: (_a = {}, _a[Op.eq] = userPhotos.rootAlbumId, _a)
                        },
                        include: [
                            {
                                model: Model.previews,
                                as: 'preview'
                            }
                        ]
                    })];
                case 1:
                    result = _b.sent();
                    // Null result implies empty bucket.
                    // TODO: Should send an error to be handled and showed on website.
                    if (result !== null) {
                        photos = result.map(function (photo) {
                            photo.name = "" + App.services.Crypt.decryptName(photo.name, 111);
                            return photo;
                        });
                        return [2 /*return*/, photos];
                    }
                    return [2 /*return*/, result];
            }
        });
    }); };
    var GetPaginationRemotePhotos = function (user, userPhotos, limit, offset) {
        if (limit === void 0) { limit = 20; }
        if (offset === void 0) { offset = 0; }
        return __awaiter(void 0, void 0, void 0, function () {
            var result, photos;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Model.photos.findAll({
                            limit: limit,
                            offset: offset,
                            where: {
                                bucketId: (_a = {}, _a[Op.eq] = userPhotos.rootAlbumId, _a)
                            },
                            order: [['creationTime', 'DESC']],
                            include: [
                                {
                                    model: Model.previews,
                                    as: 'preview'
                                }
                            ]
                        })];
                    case 1:
                        result = _b.sent();
                        // Null result implies empty bucket.
                        // TODO: Should send an error to be handled and showed on website.
                        if (result !== null) {
                            photos = result.map(function (photo) {
                                photo.name = "" + App.services.Crypt.decryptName(photo.name, 111);
                                return photo;
                            });
                            return [2 /*return*/, photos];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    var GetDeletedPhotos = function (deleteFolderId) { return new Promise(function (resolve, reject) {
        var _a;
        return Model.albums.findOne({
            where: { id: (_a = {}, _a[Op.eq] = deleteFolderId, _a) }
        }).then(function (albumPhotos) { return __awaiter(void 0, void 0, void 0, function () {
            var photos, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, albumPhotos.getPhotos()];
                    case 1:
                        photos = _a.sent();
                        if (photos !== null) {
                            result = photos.map(function (photo) {
                                photo.name = "" + App.services.Crypt.decryptName(photo.name, 111);
                                return photo;
                            });
                            resolve(result);
                        }
                        resolve(photos);
                        return [2 /*return*/];
                }
            });
        }); }).catch(function (err) {
            reject(err.message);
        });
    }); };
    var GetAlbumContent = function (user) { return new Promise(function (resolve, reject) {
        var _a, _b;
        return Model.albums.findAll({
            where: {
                userId: (_a = {}, _a[Op.eq] = user, _a)
            },
            include: [
                {
                    model: Model.photos,
                    as: 'photos',
                    where: {
                        fileId: (_b = {}, _b[Op.ne] = null, _b)
                    }
                }
            ]
        }).catch(function (err) {
            reject(err.message);
        });
    }); };
    var DeleteAlbum = function (albumId, userId) { return __awaiter(void 0, void 0, void 0, function () {
        var album, removed;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, Model.albums.findOne({
                        where: { id: (_a = {}, _a[Op.eq] = albumId, _a), userId: (_b = {}, _b[Op.eq] = userId, _b) }
                    })];
                case 1:
                    album = _c.sent();
                    if (!album) {
                        return [2 /*return*/, new Error('Album does not exists')];
                    }
                    return [4 /*yield*/, album.destroy()];
                case 2:
                    removed = _c.sent();
                    return [2 /*return*/, removed];
            }
        });
    }); };
    var getPhotosByUser = function (user) {
        var _a;
        return Model.usersphotos
            .findOne({ where: { userId: (_a = {}, _a[Op.eq] = user.id, _a) } });
    };
    var getPreviewsByBucketId = function (bucket) {
        var _a;
        return Model.previews.findAll({
            where: { bucketId: (_a = {}, _a[Op.eq] = bucket, _a) }
        });
    };
    return {
        Name: 'Photos',
        CreatePhoto: CreatePhoto,
        CreateAlbum: CreateAlbum,
        GetAllPhotosContent: GetAllPhotosContent,
        FindAlbumById: FindAlbumById,
        FindPhotoById: FindPhotoById,
        GetDeletedPhotos: GetDeletedPhotos,
        GetAlbumContent: GetAlbumContent,
        DeleteAlbum: DeleteAlbum,
        getPhotosByUser: getPhotosByUser,
        getPreviewsByBucketId: getPreviewsByBucketId,
        FindPhotoByHash: FindPhotoByHash,
        GetPartialPhotosContent: GetPartialPhotosContent,
        GetPaginationRemotePhotos: GetPaginationRemotePhotos
    };
};
