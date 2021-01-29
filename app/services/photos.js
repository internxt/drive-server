const fs = require('fs');
const path = require('path');
const sequelize = require('sequelize');

const { Op } = sequelize;
const SanitizeFilename = require('sanitize-filename');

const AesUtil = require('../../lib/AesUtil');

module.exports = (Model, App) => {
  const log = App.logger;

  // TODO: Encryption
  const mapChildrenNames = (album = []) => album.map((child) => {
    child.name = App.services.Crypt.decryptName(child.name, child.parentId);
    child.children = mapChildrenNames(child.children);

    return child;
  });

  const GetAlbumContent = async (albumId, user) => {
    const result = await Model.album.findOne({
      where: {
        id: { [Op.eq]: albumId }
      }
    });

    const photos = result.getPhotosalbum;

    // Null result implies empty album.
    // TODO: Should send an error to be handled and showed on website.

    if (photos !== null) {
      // result.name = App.services.Crypt.decryptName(result.name, result.parentId);
      // result.children = mapChildrenNames(result.children);
      // result.photos = result.photos.map((photo) => {
      // photo.name = `${App.services.Crypt.decryptName(photo.name, photo.  d)}`;

      // return photo;
    };

    return photos;
  };

  const CreateAlbum = (userId, name) => new Promise((resolve, reject) => {
    return Model.albums.create({
      user_id: userId,
      name
    }).then(resolve)
      .catch((err) => {
        console.log('Error creating album', err);
        reject(Error('Unable to create album in database'));
      });
  });

  const CreatePhoto = (user, photo) => new Promise((resolve, reject) => {
    if (!photo || !photo.id || !photo.size || !photo.name) {
      return reject(new Error('Invalid metadata for new photo'));
    }
    const photoInfo = {
      id: photo.id,
      photoId: null,
      name: photo.name,
      type: photo.type,
      size: photo.size,
      bucketId: user.rootAlbumId,
      userId: user.id
    };

    /* try {
      AesUtil.decrypt(pic.name, pic.id);
      photoInfo.encrypt_version = '03-aes';
    } catch (e) {
      (() => { })(e);
    } */

    if (photo.date) {
      photoInfo.createdAt = photo.date;
    }

    return Model.photo
      .create(photoInfo)
      .then((newPhoto) => resolve(newPhoto))
      .catch((err) => {
        console.log('Error creating entry', err);
        reject(Error('Unable to create photo in database'));
      });
  });

  const AddPhotoToAlbum = (photoId, albumId, user) => new Promise((resolve, reject) => {
    Model.album.findOne({
      where: {
        id: { [Op.eq]: albumId },
        userId: { [Op.eq]: user.id }
      }
    }).then(resolve).catch((err) => {
      reject(Error('Unable to create photoalbum in database'));
    });
  });

  const Upload = (user, userPhotos, photoName, photoPath) => new Promise((resolve, reject) => {
    try {
      if (user.mnemonic === 'null') {
        throw new Error('Your mnemonic is invalid');
      }
      const { deleteFolderId } = userPhotos.usersphoto;

      const sanitizedPicname = SanitizeFilename(photoName);

      if (photoName !== sanitizedPicname) {
        throw Error('Cannot upload, invalid photo name');
      }

      log.info(`Starting photo upload: ${photoName}`);

      // Separate filename from extension
      const photoNameParts = path.parse(photoName);
      const photoExt = photoNameParts.ext ? photoNameParts.ext.substring(1) : '';

      let encryptedPhotoName = App.services.Crypt.encryptName(photoNameParts.name, deleteFolderId);
      console.log("cryptname--", encryptedPhotoName);

      // Check if photo already exists.
      /* const exists = Model.photo.findOne({
        where: {
          name: { [Op.eq]: encryptedPhotoName },
          album_id: { [Op.eq]: albumId },
          type: { [Op.eq]: photoExt }
        }
      }); */

      // Change name if exists
      let originalEncryptedPhotoName;
      let newName;
      /* if (exists) {
        newName = GetNewMoveName(albumId, photoNameParts.name, photoExt);
        encryptedPhotoName = newName.cryptedName;
        originalEncryptedPhotoName = App.services.Crypt.encryptName(
          newName.name,
          albumId
        );
      } */

      originalEncryptedPhotoName = /* originalEncryptedPhotoName */
        App.services.Crypt.encryptName(photoNameParts.name, deleteFolderId);
      console.log("original enc------", originalEncryptedPhotoName);
      const originalEncryptedPhotoNameWithExt = `${originalEncryptedPhotoName}${photoExt ? `.${photoExt}` : ''}`;
      log.info('Uploading photo to network...');

      const { rootAlbumId } = userPhotos.usersphoto;
      return App.services.StorjPhotos.StorePhoto(
        userPhotos,
        rootAlbumId,
        originalEncryptedPhotoNameWithExt,
        photoExt,
        photoPath
      ).then(async ({ fileId, fileName, size, ext, bucket, userId }) => {
        if (!fileId) return reject(Error('Missing photo id'));

        if (!size) return reject(Error('Missing photo size'));

        const newPhotoInfo = {
          name: fileName,
          type: ext,
          fileId,
          bucketId: bucket,
          size,
          userId
        };


        const addedPhoto = await Model.photos.create(newPhotoInfo);

        console.log(addedPhoto);
        return resolve(addedPhoto);
      })
        .catch((err) => {
          log.error(err.message);
          reject(err.message);
        });
    } catch (err) {
      log.error(err.message);

      return reject(err.message);
    } finally {
      fs.unlink(photoPath, (error) => {
        if (error) throw error;
        console.log(`Deleted:  ${photoPath}`);
      });
    }
  });

  const DownloadPhoto = (user, picId) => {
    const maxAcceptableSize = 1024 * 1024 * 300; // 300MB

    return new Promise((resolve, reject) => {
      if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid');

      Model.photo
        .findOne({ where: { photo_id: { [Op.eq]: picId } } })
        .then((photo) => {
          if (!photo) {
            throw Error('Photo not found on database, please refresh');
          } else if (photo.size > maxAcceptableSize) {
            // 300MB
            throw Error('Photo too large');
          }

          App.services.Storj.ResolvePhoto(user, photo)
            .then((result) => {
              resolve({
                ...result, albumId: photo.album_id, name: photo.name, type: photo.type
              });
            })
            .catch((err) => {
              if (err.message === 'Photo already exists') {
                resolve({ photo: { name: `${photo.name}${photo.type ? `${photo.type}` : ''}` } });
              } else {
                reject(err);
              }
            });
        })
        .catch(reject);
    });
  };

  const GetNewMoveName = async (destination, originalName, type) => {
    let exists = true;
    let i = 1;
    let nextName;
    let nextCryptedName;
    while (exists) {
      nextName = App.services.Utils.getNewMoveName(originalName, i);
      nextCryptedName = App.services.Crypt.encryptName(
        App.services.Utils.getNewMoveName(originalName, i),
        destination
      );
      // eslint-disable-next-line no-await-in-loop
      exists = !!(await Model.photosalbum.findOne({
        where: {
          album_id: { [Op.eq]: destination },
          name: { [Op.eq]: nextCryptedName },
          type: { [Op.eq]: type }
        },
        raw: true
      }));
      i += 1;
    }

    return { cryptedName: nextCryptedName, name: nextName };
  };

  const GetAllPhotos = (user, previewsBucketId) => new Promise((resolve, reject) => {
    App.services.StorjPhotos.ListBucketContent(user, previewsBucketId)
      .then(resolve)
      .catch((err) => reject(err.message));
  });

  const GetAlbumList = (userId) => new Promise((resolve, reject) => {
    return Model.albums.findAll({
      where: { user_id: { [Op.eq]: userId } }
    }).then(async (albumList) => {
      await albumList.map(async (album) => {
        const albumPhotos = await Model.photosalbum.findAll({
          where: { album_id: { [Op.eq]: album.id } }
        });

        if (albumPhotos.length > 12) {
          const albumPreview = albumPhotos.split(0, 11);
          album.albumPreview = albumPreview;
        } else {
          album.albumPreview = albumPhotos;
        }
      });
      resolve(albumList);
    }).catch((err) => {
      reject(err.message);
    });
  });

  const GetDeletedPhotos = (deleteFolderId) => new Promise((resolve, reject) => {
    return Model.albums.findOne({
      where: { album_id: { [Op.eq]: deleteFolderId } }
    }).then((albumPhotos) => {
      if (albumPhotos.getPhotosalbum.length > 20) {
        const albumPreview = albumPhotos.getPhotosalbum.split(0, 20);
        resolve(albumPreview);
      } else {
        const previews = albumPhotos.getPhotosalbum;
        resolve(previews);
      }
    }).catch((err) => {
      reject(err.message);
    });
  });

  const FindAlbumById = (albumId) => Model.albums.findOne({ where: { id: { [Op.eq]: albumId } } });

  const FindPhotoById = (photoId) => Model.photos.findOne({ where: { id: { [Op.eq]: photoId } } });

  return {
    Name: 'Photos',
    CreatePhoto,
    CreateAlbum,
    AddPhotoToAlbum,
    Upload,
    DownloadPhoto,
    GetNewMoveName,
    GetAlbumContent,
    FindAlbumById,
    FindPhotoById,
    GetAlbumList,
    GetAllPhotos,
    GetDeletedPhotos
  };
};
