const fs = require('fs');
const path = require('path');
const sequelize = require('sequelize');

const { Op } = sequelize;
const SanitizeFilename = require('sanitize-filename');
const { validateMnemonic } = require('bip39');

module.exports = (Model, App) => {
  const log = App.logger;

  const FindPreviewByPhotoId = (photoId) => Model.previews.findOne({ where: { photoId: { [Op.eq]: photoId } } });

  const UploadPreview = (user, photoName, photoPath, photoId, hash) => new Promise(async (resolve, reject) => {
    try {
      const isValidMnemonic = validateMnemonic(user.mnemonic);
      if (user.mnemonic === 'null' || !isValidMnemonic) {
        throw Error('Your mnemonic is invalid');
      }

      const sanitizedPicname = SanitizeFilename(photoName);

      if (photoName !== sanitizedPicname) {
        throw Error('Cannot upload, invalid preview name');
      }

      log.info(`Starting preview upload: ${photoName}`);

      // Separate filename from extension
      const photoNameParts = path.parse(photoName);
      const photoExt = photoNameParts.ext ? photoNameParts.ext.substring(1) : '';

      // Change name if exists
      const originalEncryptedPhotoName = App.services.Crypt.encryptName(photoNameParts.name, 111);

      log.info('Uploading preview to network...');

      const { rootPreviewId } = await user.getUsersphoto();
      return App.services.StorjPhotos.StorePhoto(
        user,
        rootPreviewId,
        originalEncryptedPhotoName,
        photoExt,
        photoPath,
        photoId
      ).then(async ({
        fileId,
        fileName,
        size,
        ext,
        bucketId
      }) => {
        if (!fileId) return reject(Error('Missing preview id'));

        if (!size) return reject(Error('Missing preview size'));

        const newPhotoInfo = {
          name: fileName,
          type: ext,
          fileId,
          bucketId,
          size,
          photoId,
          hash
        };

        const addedPhoto = await Model.previews.create(newPhotoInfo);

        return resolve(addedPhoto);
      })
        .catch((err) => {
          log.error('upload preview 2', err);
          reject(err.message);
        });
    } catch (err) {
      log.error('upload preview', err.message);

      return reject(err.message);
    } finally {
      fs.unlink(photoPath, (error) => {
        if (error) throw error;
        log.info(`Deleted:  ${photoPath}`);
      });
    }
  });
  return {
    Name: 'Previews',
    UploadPreview,
    FindPreviewByPhotoId
  };
};
