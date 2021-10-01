const sequelize = require('sequelize');

const { Op } = sequelize;

module.exports = (Model) => {
  const FindPreviewByPhotoId = (photoId) => Model.previews.findOne({ where: { photoId: { [Op.eq]: photoId } } });

  return {
    Name: 'Previews',
    FindPreviewByPhotoId
  };
};
