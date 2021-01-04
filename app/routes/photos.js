const upload = require('../middleware/multer');
const passport = require('../middleware/passport');
const { passportAuth } = passport;

module.exports = (Router, Service, Logger, App) => {

  Router.get('/photos/hola', (req, res) => {
    res.status(200).send({ text: "Hola Fotos!" })
  })

  /**
   * INDEX:
   *  /photos/album/:id -> Get album
   *  /photos/album -> Add album
   *  /photos/album/:id -> Delete album
   *  /photos/pic -> Add photo
   *  /photos/pic/:id-> Download photo
   */


  /**
   * @swagger
   * /photos/album/:id:
   *   get:
   *     description: Get album contents.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: folderId
   *         description: ID of album in the network.
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Array of album items
   */
  Router.get('/photos/album/:id', passportAuth, (req, res) => {
    const albumId = req.params.id;
    Service.Photos.GetContent(albumId, req.user)
      .then((result) => {
        if (result == null) {
          res.status(500).send([]);
        } else {
          res.status(200).json(result);
        }
      })
      .catch((err) => {
        Logger.error(`${err.message}\n${err.stack}`);
        res.status(500).json(err);
      });
  });


  /**
   * @swagger
   * /photos/album:
   *   post:
   *     description: Create album.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: albumName
   *         description: Name of the new album.
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Creation response.
   */
  Router.post('/photos/album', passportAuth, (req, res) => {
    const { albumName } = req.body;
    const { parentAlbumId } = req.body;

    const { user } = req;
    user.mnemonic = req.headers['internxt-mnemonic'];

    Service.Photos.CreateAlbum(user, albumName, parentAlbumId)
      .then((result) => {
        res.status(201).json(result);
      })
      .catch((err) => {
        Logger.warn(err);
        res.status(500).json({ error: err.message });
      });
  });


  /**
   * @swagger
   * /photos/album/:id:
   *   delete:
   *     description: Delete an album.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: albumId
   *         description: ID of album in the network.
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Delete response.
   */
  Router.delete('/photos/album/:id', passportAuth, (req, res) => {
    const { user } = req;
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const albumId = req.params.id;

    Service.Photos.DeleteAlbum(user, albumId)
      .then((result) => {
        res.status(204).json(result);
      })
      .catch((err) => {
        Logger.error(`${err.message}\n${err.stack}`);
        res.status(500).json(err);
      });
  });


  /**
   * @swagger
   * /photos/pic
   *    post:
   *      description: Create file entry on DB for an existing file on the network.
   *      produces:
   *       - application/json
   *      parameters:
   *       - name: pic
   *         description: INew photo to create.
   *         in: query
   *         required: true
   *      responses:
   *       200:
   *         description: Post response.
   * 
   */
  Router.post('/photos/pic', passportAuth, (req, res) => {
    const { user } = req;
    const { pic } = req.body;

    Service.Photos.CreatePhoto(user, pic).then((result) => {
      res.status(200).json(result);
      const NOW = (new Date()).toISOString()
    }).catch((error) => {
      Logger.error(error);
      res.status(400).json({ message: error.message });
    });
  });


  /**
   * @swagger
   * /photos/pic/:id:
   *   get:
   *     description: Get photo of the network.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: picId
   *         description: ID of photo in the network.
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Photo object.
   */
  Router.get('/photos/pic/:id', passportAuth, (req, res) => {
    const { user } = req;
    // Set mnemonic to decrypted mnemonic
    user.mnemonic = req.headers['internxt-mnemonic'];
    const picIdInBucket = req.params.id;
    if (picIdInBucket === 'null') {
      return res.status(500).send({ message: 'Missing pic id' });
    }

    let picPath;

    return Service.Photos.DownloadPhoto(user, picIdInBucket)
      .then(({
        picstream, mimetype, downloadedPhoto, albumId, name, type
      }) => {
        picPath = downloadedPhoto;
        const picName = downloadedPhoto.split('/')[2];
        const decryptedPicName = App.services.Crypt.decryptName(name, albumId);

        const picNameDecrypted = `${decryptedPicName}${type ? `.${type}` : ''}`;
        const decryptedPicNameB64 = Buffer.from(picNameDecrypted).toString('base64');

        res.setHeader('content-disposition', contentDisposition(picNameDecrypted));
        res.setHeader('content-type', mimetype);
        res.set('x-photo-name', decryptedPicNameB64);
        picstream.pipe(res);
        fs.unlink(picPath, (error) => {
          if (error) throw error;
        });
      })
      .catch((err) => {
        if (err.message === 'Bridge rate limit error') {
          return res.status(402).json({ message: err.message });
        }

        return res.status(500).json({ message: err.message });
      });
  });
}