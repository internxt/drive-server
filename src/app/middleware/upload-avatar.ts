import multer from 'multer';
import multerS3 from 'multer-s3';
import AvatarS3 from '../../config/initializers/avatarS3';
import * as uuid from 'uuid';

const uploadAvatar = multer({
  storage: multerS3({
    s3: AvatarS3.getInstance(),
    bucket: process.env.AVATAR_BUCKET as string,
    key: function (req, file, cb) {
      cb(null, uuid.v4());
    },
  }),
  limits: {
    fileSize: 1024 * 1024,
  },
}).single('avatar');

export default uploadAvatar;
