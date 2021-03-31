const fs = require('fs');
const path = require('path');
const sequelize = require('sequelize');

const { Op } = sequelize;
const SanitizeFilename = require('sanitize-filename');
const { validateMnemonic } = require('bip39');

module.exports = (Model, App) => {
  const log = App.logger;

  const FindAlbumById = (albumId, userId) => Model.albums.findOne({
    where: {
      id: { [Op.eq]: albumId },
      userId: { [Op.eq]: userId }
    }
  });

  const FindPhotoById = (photosUser, photoId) => Model.photos.findOne({
    where: {
      id: { [Op.eq]: photoId },
      userId: { [Op.eq]: photosUser.id }
    }
  });

  const FindPhotoByHash = (photosUser, hash) => {
    return Model.photos.findOne({
      where: {
        hash: { [Op.eq]: hash },
        userId: { [Op.eq]: photosUser.id }
      }
    });
  };

  const CreateAlbum = (userId, name) => new Promise((resolve, reject) => {
    // Prevent strange folder names from being created
    const sanitizedAlbumName = SanitizeFilename(name);

    if (name === '' || sanitizedAlbumName !== name) {
      throw Error('Invalid album name');
    }

    // Encrypt folder name, TODO: use versioning for encryption
    const cryptoAlbumName = App.services.Crypt.encryptName(name,
      333);

    return Model.albums.create({
      name: cryptoAlbumName,
      userId
    }).then((result) => {
      resolve(result);
    })
      .catch((err) => {
        log('Error creating album', err);
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

    if (photo.date) {
      photoInfo.createdAt = photo.date;
    }

    return Model.photo
      .create(photoInfo)
      .then((newPhoto) => resolve(newPhoto))
      .catch((err) => {
        log('Error creating entry', err);
        reject(Error('Unable to create photo in database'));
      });
  });

  const UploadPhoto = (user, photoName, photoPath, hash) => new Promise(async (resolve, reject) => {
    try {
      const isValidMnemonic = validateMnemonic(user.mnemonic);
      if (user.mnemonic === 'null' || !isValidMnemonic) {
        throw Error('Your mnemonic is invalid');
      }

      const sanitizedPicname = SanitizeFilename(photoName);

      if (photoName !== sanitizedPicname) {
        throw Error('Cannot upload, invalid photo name');
      }

      log.info(`Starting photo upload: ${photoName}`);

      // Separate filename from extension
      const photoNameParts = path.parse(photoName);
      const photoExt = photoNameParts.ext ? photoNameParts.ext.substring(1) : '';

      // Change name if exists
      const originalEncryptedPhotoName = App.services.Crypt.encryptName(photoNameParts.name, 111);

      const userPhotos = await user.getUsersphoto();
      const { rootAlbumId } = userPhotos;

      return App.services.StorjPhotos.StorePhoto(
        user,
        rootAlbumId,
        originalEncryptedPhotoName,
        photoExt,
        photoPath
      ).then(async ({
        fileId,
        fileName,
        size,
        ext,
        bucketId,
        userId
      }) => {
        if (!fileId) return reject(Error('Missing photo id'));

        if (!size) return reject(Error('Missing photo size'));

        const newPhotoInfo = {
          name: fileName, type: ext, fileId, bucketId, size, userId, hash
        };

        const addedPhoto = await Model.photos.create(newPhotoInfo);

        resolve(addedPhoto);
      }).catch((err) => {
        log.error('upload photo 2', err);
        reject(err.message);
      });
    } catch (err) {
      log.error('upload photo', err.message);

      return reject(err.message);
    } finally {
      fs.unlink(photoPath, (error) => {
        if (error) throw error;
        log.info(`Deleted:  ${photoPath}`);
      });
    }
  });

  const DownloadPhoto = (user, item) => {
    const maxAcceptableSize = 1024 * 1024 * 300; // 300MB
    if (user.mnemonic === 'null') throw Error('Your mnemonic is invalid');

    return new Promise((resolve, reject) => {
      Model.photos
        .findOne({ where: { id: { [Op.eq]: item } } })
        .then((photo) => {
          if (!photo) {
            throw Error('Photo not found on database, please refresh');
          } else if (photo.size > maxAcceptableSize) {
            // 300MB
            throw Error('Photo too large');
          }

          App.services.StorjPhotos.ResolvePhoto(user, photo)
            .then((result) => {
              resolve({
                ...result, name: photo.name, type: photo.type, size: photo.size
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

  const DownloadPreview = (user, previewId) => {
    return new Promise((resolve, reject) => {
      if (user.mnemonic === 'null') throw Error('Your mnemonic is invalid');

      Model.previews
        .findOne({ where: { fileId: { [Op.eq]: previewId } } })
        .then((photo) => {
          App.services.StorjPhotos.ResolvePhoto(user, photo)
            .then((result) => {
              resolve({
                ...result, name: photo.name, type: photo.type, size: photo.size
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

  const GetPartialPhotosContent = async (user, userPhotos, hashList) => {
    const result = await Model.photos.findAll({
      where: {
        userId: { [Op.eq]: userPhotos.id },
        hash: { [Op.in]: hashList }
      },
      include: [
        {
          model: Model.previews,
          as: 'preview'
        }
      ]
    });

    if (result !== null) {
      const photos = result.map((photo) => {
        photo.name = `${App.services.Crypt.decryptName(photo.name, 111)}`;

        return photo;
      });
      return photos;
    }

    return result;
  };

  const GetAllPhotosContent = async (user, userPhotos) => {
    const result = await Model.photos.findAll({
      where: {
        bucketId: { [Op.eq]: userPhotos.rootAlbumId }
      },
      include: [
        {
          model: Model.previews,
          as: 'preview'
        }
      ]
    });

    // Null result implies empty bucket.
    // TODO: Should send an error to be handled and showed on website.

    if (result !== null) {
      const photos = result.map((photo) => {
        photo.name = `${App.services.Crypt.decryptName(photo.name, 111)}`;

        return photo;
      });
      return photos;
    }

    return result;
  };

  const GetAlbumList = (userId) => new Promise((resolve, reject) => {
    return Model.albums.findAll({
      where: { user_id: { [Op.eq]: userId } }
    }).then(async (albumList) => {
      await albumList.map(async (album) => {
        const albumPhotos = await Model.photosalbums.findAll({
          where: { albumId: { [Op.eq]: album.id } }
        });

        if (albumPhotos.length > 12) {
          const albumPreview = albumPhotos.split(0, 11);
          album.albumPreview = albumPreview;
        } else {
          album.albumPreview = albumPhotos;
        }
        return album;
      });
      resolve(albumList);
    }).catch((err) => {
      reject(err.message);
    });
  });

  const GetDeletedPhotos = (deleteFolderId) => new Promise((resolve, reject) => {
    return Model.albums.findOne({
      where: { id: { [Op.eq]: deleteFolderId } }
    }).then(async (albumPhotos) => {
      const photos = await albumPhotos.getPhotos();

      if (photos !== null) {
        const result = photos.map((photo) => {
          photo.name = `${App.services.Crypt.decryptName(photo.name, 111)}`;

          return photo;
        });
        resolve(result);
      }

      resolve(photos);
    }).catch((err) => {
      reject(err.message);
    });
  });

  const GetAlbumContent = (user) => new Promise((resolve, reject) => {
    return Model.albums.findAll({
      where: {
        userId: { [Op.eq]: user }
      },
      include: [
        {
          model: Model.photos,
          as: 'photos',
          where: {
            fileId: { [Op.ne]: null }
          }

        }
      ]
    }).then((albumPhotos) => {
      resolve(albumPhotos);
    }).catch((err) => {
      reject(err.message);
    });
  });

  const MoveToAlbum = (photo, album) => new Promise((resolve, reject) => {
    album.addPhotos([photo]).then(() => resolve).catch((err) => {
      reject(err);
    });
  });

  const DeleteAlbum = async (albumId, userId) => {
    const album = await Model.albums.findOne({
      where: { id: { [Op.eq]: albumId }, userId: { [Op.eq]: userId } }
    });

    if (!album) {
      return new Error('Album does not exists');
    }

    // Destroy album
    const removed = await album.destroy();

    return removed;
  };

  const DeletePhoto = (photoId, user) => new Promise((resolve, reject) => {
    Model.photos
      .findOne({ where: { id: { [Op.eq]: photoId }, userId: { [Op.eq]: user.usersphoto.id } } }).then((photoObj) => {
        if (!photoObj) {
          reject(new Error('Photo not found'));
        } else if (photoObj.fileId) {
          App.services.StorjPhotos.DeleteFile(user, photoObj.bucket, photoObj.fileId).then(() => {
            photoObj.destroy().then(resolve).catch(reject);
          }).catch((err) => {
            const resourceNotFoundPattern = /Resource not found/;

            if (resourceNotFoundPattern.exec(err.message)) {
              photoObj.destroy().then(resolve).catch(reject);
            } else {
              log.error('Error deleting file from bridge:', err.message);
              reject(err);
            }
          });
        } else {
          photoObj.destroy().then(resolve).catch(reject);
        }
      }).catch((err) => {
        log.error('Failed to find folder on database:', err.message);
        reject(err);
      });
  });

  const getPhotosByUser = (user) => {
    return new Promise((resolve, reject) => {
      Model.usersphotos
        .findOne({ where: { userId: { [Op.eq]: user.id } } })
        .then((userPhoto) => {
          resolve(userPhoto);
        })
        .catch(() => {
          reject();
        });
    });
  };

  const getPreviewsByBucketId = (bucket) => {
    return new Promise((resolve, reject) => {
      Model.previews.findAll({
        where: { bucketId: { [Op.eq]: bucket } }
      }).then((listPreviews) => {
        resolve(listPreviews);
      }).catch(() => reject());
    });
  };

  return {
    Name: 'Photos',
    CreatePhoto,
    CreateAlbum,
    UploadPhoto,
    DownloadPhoto,
    GetAllPhotosContent,
    FindAlbumById,
    FindPhotoById,
    GetAlbumList,
    GetDeletedPhotos,
    MoveToAlbum,
    GetAlbumContent,
    DeleteAlbum,
    DeletePhoto,
    DownloadPreview,
    getPhotosByUser,
    getPreviewsByBucketId,
    FindPhotoByHash,
    GetPartialPhotosContent
  };
};
