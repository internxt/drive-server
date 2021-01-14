const fs = require('fs');
const path = require('path');
const sequelize = require('sequelize');

const { Op } = sequelize;
const SanitizeFilename = require('sanitize-filename');

const AesUtil = require('../../lib/AesUtil');

module.exports = (Model, App) => {
  const log = App.logger;
  const CreatePhoto = (user, pic) => new Promise((resolve, reject) => {
    if (!pic || !pic.id || !pic.bucket || !pic.size || !pic.album_id || !pic.name) {
      return reject(new Error('Invalid metadata for new photo'));
    }

    return Model.album.findOne({
      where: {
        id: { [Op.eq]: pic.album_id },
        user_id: { [Op.eq]: user.id }
      }
    }).then(async (album) => {
      if (!album) {
        return reject(new Error('Album not found / Is not your album'));
      }

      const picExists = await Model.photo.findOne({
        where: {
          name: { [Op.eq]: pic.name },
          album_id: { [Op.eq]: album.id },
          type: { [Op.eq]: pic.type }
        }
      });

      if (picExists) {
        return reject(new Error('Photo entry already exists'));
      }

      const photoInfo = {
        id: pic.id,
        name: pic.name,
        type: pic.type,
        size: pic.size,
        album_id: pic.album_id,
        bucket: pic.bucket
        // encrypt_version: pic.encrypt_version
      };

      /* try {
        AesUtil.decrypt(pic.name, pic.id);
        photoInfo.encrypt_version = '03-aes';
      } catch (e) {
        (() => { })(e);
      } */

      if (pic.date) {
        photoInfo.createdAt = pic.date;
      }

      return Model.photo
        .create(photoInfo)
        .then(resolve)
        .catch((err) => {
          console.log('Error creating entry', err);
          reject(Error('Unable to create photo in database'));
        });
    })
      .catch((err) => {
        console.log('Other error', err);
        reject(Error(`Cannot find bucket ${pic.album_id}`));
      });
  });

  const UploadPhoto = (user, albumId, picName, picPath) => new Promise((resolve, reject) => {
    try {
      if (user.mnemonic === 'null') {
        throw new Error('Your mnemonic is invalid');
      }

      const sanitizedPicname = SanitizeFilename(picName);

      if (picName !== sanitizedPicname) {
        throw Error('Cannot upload, invalid pic name');
      }

      log.info(`Starting pic upload: ${picName}`);

      const rootAlbum = Model.album.findOne({
        where: { id: { [Op.eq]: user.root_album_id } }
      });
      const album = Model.album.findOne({
        where: { id: { [Op.eq]: albumId } }
      });

      if (!rootAlbum.bucket) return reject(Error('Missing pic bucket'));

      // Separate filename from extension
      const picNameParts = path.parse(picName);
      const picExt = picNameParts.ext ? picNameParts.ext.substring(1) : '';

      let encryptedPicName = App.services.Crypt.encryptName(picNameParts.name, albumId);

      // Check if photo already exists.
      const exists = Model.photo.findOne({
        where: {
          name: { [Op.eq]: encryptedPicName },
          album_id: { [Op.eq]: albumId },
          type: { [Op.eq]: picExt }
        }
      });

      // Change name if exists
      let originalEncryptedPicName;
      let newName;
      if (exists) {
        newName = GetNewMoveName(albumId, picNameParts.name, picExt);
        encryptedPicName = newName.cryptedName;
        originalEncryptedPicName = App.services.Crypt.encryptName(
          newName.name,
          albumId
        );
      }

      originalEncryptedPicName = originalEncryptedPicName
        || App.services.Crypt.encryptName(picNameParts.name, albumId);
      const originalEncryptedPicNameWithExt = `${originalEncryptedPicName}${picExt ? `.${picExt}` : ''}`;
      log.info('Uploading photo to network...');

      return App.services.Storj.StoreFile(
        user,
        rootAlbum.bucket,
        originalEncryptedPicNameWithExt,
        picPath
      ).then(async ({ picId, size }) => {
        if (!picId) return reject(Error('Missing pic id'));

        if (!size) return reject(Error('Missing pic size'));

        const newPicInfo = {
          name: encryptedPicName,
          type: picExt,
          picId,
          bucket: rootAlbum.bucket,
          size
        };

        /* try {
          AesUtil.decrypt(encryptedPicName, albumId);
          newPicInfo.encrypt_version = '03-aes';
        } catch (e) {
          (() => { })(e);
        } */

        const addedPhoto = await Model.photo.create(newPicInfo);
        try {
          await Model.album.addPhoto(addedPhoto);
        } catch (e) {
          log.error('Cannot add photo to non existent album');
        }

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
      fs.unlink(picPath, (error) => {
        if (error) throw error;
        console.log(`Deleted:  ${picPath}`);
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

  const ListAllPhotos = (user, bucketId) => new Promise((resolve, reject) => {
    App.services.StorjPhotos.ListBucketPhotos(user, bucketId)
      .then(resolve)
      .catch((err) => reject(err.message));
  });

  return {
    Name: 'Photos',
    CreatePhoto,
    UploadPhoto,
    DownloadPhoto,
    GetNewMoveName,
    ListAllPhotos
  };
};
