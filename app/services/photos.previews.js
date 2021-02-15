const fs = require('fs');
const path = require('path');
const sequelize = require('sequelize');

const { Op } = sequelize;
const SanitizeFilename = require('sanitize-filename');

const AesUtil = require('../../lib/AesUtil');

module.exports = (Model, App) => {
  const log = App.logger;

  const FindPreviewByPhotoId = (photoId) => Model.previews.findOne({ where: { photoId: { [Op.eq]: photoId } } });

  const UploadPreview = (userPhotos, photoName, photoPath, photoId) => new Promise((resolve, reject) => {
    try {
      if (userPhotos.mnemonic === 'null') {
        throw new Error('Your mnemonic is invalid');
      }

      const sanitizedPicname = SanitizeFilename(photoName);

      if (photoName !== sanitizedPicname) {
        throw Error('Cannot upload, invalid preview name');
      }

      log.info(`Starting preview upload: ${photoName}`);

      // Separate filename from extension
      const photoNameParts = path.parse(photoName);
      const photoExt = photoNameParts.ext ? photoNameParts.ext.substring(1) : '';

      let encryptedPhotoName = App.services.Crypt.encryptName(photoNameParts.name, 222);

      // Check if photo already exists.
      const exists = Model.previews.findOne({
        where: {
          name: { [Op.eq]: encryptedPhotoName },
          type: { [Op.eq]: photoExt }
        }
      });
      // Change name if exists
      let originalEncryptedPhotoName;
      let newName;
      if (exists) {
        // reject(Error('Photo already exists.'));
        /* newName = GetNewMoveName(111, photoNameParts.name, photoExt);
        encryptedPhotoName = newName.cryptedName;
        originalEncryptedPhotoName = App.services.Crypt.encryptName(
          newName.name,
          111
        ); */
      }

      originalEncryptedPhotoName = /* originalEncryptedPhotoName */
        App.services.Crypt.encryptName(photoNameParts.name, 111);
      const originalEncryptedPhotoNameWithExt = `${originalEncryptedPhotoName}${photoExt ? `.${photoExt}` : ''}`;
      log.info('Uploading preview to network...');

      const { rootPreviewId } = userPhotos.usersphoto;
      return App.services.StorjPhotos.StorePhoto(
        userPhotos,
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
          photoId
        };

        const addedPhoto = await Model.previews.create(newPhotoInfo);

        return resolve(addedPhoto);
      })
        .catch((err) => {
          log.error("upload preview 2", err);
          reject(err.message);
        });
    } catch (err) {
      log.error("upload preview", err.message);

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
