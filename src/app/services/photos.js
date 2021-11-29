const sequelize = require('sequelize');

const { Op } = sequelize;
const SanitizeFilename = require('sanitize-filename');

module.exports = (Model, App) => {
  const log = App.logger;

  const FindAlbumById = (albumId, userId) =>
    Model.albums.findOne({
      where: {
        id: { [Op.eq]: albumId },
        userId: { [Op.eq]: userId },
      },
    });

  const FindPhotoById = (photosUser, photoId) =>
    Model.photos.findOne({
      where: {
        id: { [Op.eq]: photoId },
        userId: { [Op.eq]: photosUser.id },
      },
    });

  const FindPhotoByHash = (photosUser, hash) => {
    return Model.photos.findOne({
      where: {
        hash: { [Op.eq]: hash },
        userId: { [Op.eq]: photosUser.id },
      },
    });
  };

  const CreateAlbum = (userId, name) =>
    new Promise((resolve, reject) => {
      // Prevent strange folder names from being created
      const sanitizedAlbumName = SanitizeFilename(name);

      if (name === '' || sanitizedAlbumName !== name) {
        throw Error('Invalid album name');
      }

      // Encrypt folder name, TODO: use versioning for encryption
      const cryptoAlbumName = App.services.Crypt.encryptName(name, 333);

      return Model.albums
        .create({
          name: cryptoAlbumName,
          userId,
        })
        .catch((err) => {
          log('Error creating album', err);
          reject(Error('Unable to create album in database'));
        });
    });

  const CreatePhoto = (user, photo) =>
    new Promise((resolve, reject) => {
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
        userId: user.id,
      };

      if (photo.date) {
        photoInfo.createdAt = photo.date;
      }

      return Model.photo.create(photoInfo).catch((err) => {
        log('Error creating entry', err);
        reject(Error('Unable to create photo in database'));
      });
    });

  const GetPartialPhotosContent = async (user, userPhotos, hashList) => {
    const result = await Model.photos.findAll({
      where: {
        userId: { [Op.eq]: userPhotos.id },
        hash: { [Op.in]: hashList },
      },
      include: [
        {
          model: Model.previews,
          as: 'preview',
        },
      ],
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
        bucketId: { [Op.eq]: userPhotos.rootAlbumId },
      },
      include: [
        {
          model: Model.previews,
          as: 'preview',
        },
      ],
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

  const GetPaginationRemotePhotos = async (user, userPhotos, limit = 20, offset = 0) => {
    const result = await Model.photos.findAll({
      limit,
      offset,
      where: {
        bucketId: { [Op.eq]: userPhotos.rootAlbumId },
      },
      order: [['creationTime', 'DESC']],
      include: [
        {
          model: Model.previews,
          as: 'preview',
        },
      ],
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

  const GetDeletedPhotos = (deleteFolderId) =>
    new Promise((resolve, reject) => {
      return Model.albums
        .findOne({
          where: { id: { [Op.eq]: deleteFolderId } },
        })
        .then(async (albumPhotos) => {
          const photos = await albumPhotos.getPhotos();

          if (photos !== null) {
            const result = photos.map((photo) => {
              photo.name = `${App.services.Crypt.decryptName(photo.name, 111)}`;

              return photo;
            });
            resolve(result);
          }

          resolve(photos);
        })
        .catch((err) => {
          reject(err.message);
        });
    });

  const GetAlbumContent = (user) =>
    new Promise((resolve, reject) => {
      return Model.albums
        .findAll({
          where: {
            userId: { [Op.eq]: user },
          },
          include: [
            {
              model: Model.photos,
              as: 'photos',
              where: {
                fileId: { [Op.ne]: null },
              },
            },
          ],
        })
        .catch((err) => {
          reject(err.message);
        });
    });

  const DeleteAlbum = async (albumId, userId) => {
    const album = await Model.albums.findOne({
      where: { id: { [Op.eq]: albumId }, userId: { [Op.eq]: userId } },
    });

    if (!album) {
      return new Error('Album does not exists');
    }

    // Destroy album
    const removed = await album.destroy();

    return removed;
  };

  const getPhotosByUser = (user) => {
    return Model.usersphotos.findOne({ where: { userId: { [Op.eq]: user.id } } });
  };

  const getPreviewsByBucketId = (bucket) => {
    return Model.previews.findAll({
      where: { bucketId: { [Op.eq]: bucket } },
    });
  };

  return {
    Name: 'Photos',
    CreatePhoto,
    CreateAlbum,
    GetAllPhotosContent,
    FindAlbumById,
    FindPhotoById,
    GetDeletedPhotos,
    GetAlbumContent,
    DeleteAlbum,
    getPhotosByUser,
    getPreviewsByBucketId,
    FindPhotoByHash,
    GetPartialPhotosContent,
    GetPaginationRemotePhotos,
  };
};
