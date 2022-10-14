const sequelize = require('sequelize');
const { Op } = sequelize;

module.exports = (Model, App) => {
  const CreateThumbnail = async (user, thumbnail) => {

    const thumbnailExists = await Model.thumbnail.findOne({
      where: {
        file_id: { [Op.eq]: thumbnail.file_id },
        type: { [Op.eq]: thumbnail.type },
      },
    });

    const thumbnailInfo = {
      file_id: thumbnail.file_id,
      type: thumbnail.type,
      max_width: thumbnail.max_width,
      max_height: thumbnail.max_height,
      size: thumbnail.size,
      bucket_id: thumbnail.bucket_id,
      bucket_file: thumbnail.bucket_file,
      encrypt_version: thumbnail.encrypt_version,
      created_at: thumbnail.created_at || new Date(),
      updated_at: thumbnail.updated_at || new Date(),
    };

    if (thumbnailExists) {
      thumbnailInfo.updated_at = new Date();
      await App.services.Inxt.DeleteFile(user, thumbnailExists.bucket_id, thumbnailExists.bucket_file);
      await Model.thumbnail.update(
        thumbnailInfo,
        {
          where: {
            file_id: { [Op.eq]: thumbnail.file_id },
            max_width: { [Op.eq]: thumbnail.max_width },
            max_height: { [Op.eq]: thumbnail.max_height },
            type: { [Op.eq]: thumbnail.type },
          }
        },
      );
      return await Model.thumbnail.findOne({
        where: {
          file_id: { [Op.eq]: thumbnail.file_id },
          max_width: { [Op.eq]: thumbnail.max_width },
          max_height: { [Op.eq]: thumbnail.max_height },
          type: { [Op.eq]: thumbnail.type },
        },
      });
    } else {
      return Model.thumbnail.create(thumbnailInfo);
    }
  };

  return {
    Name: 'Thumbnails',
    CreateThumbnail,
  };
};
