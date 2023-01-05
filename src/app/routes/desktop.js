const { passportAuth } = require('../middleware/passport');
const logger = require('../../lib/logger').default;
const Logger = logger.getInstance();

function logError(context, user, err) {
  Logger.error(
    `[DESKTOP/${context}]: Error for user %s (UUID %s): %s. %s`, 
    user.email, 
    user.uuid, 
    err.message, 
    err.stack || 'NO STACK.'
  );
}

module.exports = (Router, Service) => {
  Router.get('/storage/tree', passportAuth, (req, res) => {
    res.status(500).send({ error: 'Outdated desktop version' });
  });

  Router.get('/desktop/tree', passportAuth, (req, res) => {
    res.status(500).send({ error: 'Outdated desktop version' });
  });

  Router.get('/desktop/list/:index', passportAuth, (req, res) => {
    const { user } = req;
    const index = parseInt(req.params.index, 10);
    const deleted = req.query?.trash === 'true';

    if (Number.isNaN(index)) {
      return res.status(400).send({ error: 'Bad Index' });
    }

    return Service.Folder.GetFoldersPaginationWithoutSharesNorThumbnails(
      user, 
      index, 
      { deleted }
    ).then((result) => {
      res.status(200).send(result);
    }).catch((err) => {
      logError('LIST', user, err);
      res.status(500).send({ error: 'Internal Server Error' });
    });
  });

  Router.put('/user/sync', passportAuth, (req, res) => {
    const { user, body } = req;
    Service.User.UpdateUserSync(user, body.toNull)
      .then((result) => {
        res.status(200).json({ data: result });
      })
      .catch((err) => {
        logError('SYNC', user, err);
        res.status(500).json({ error: err.message });
      });
  });

  const ENSURE = {
    OFF: 0,
    RANDOM: 1,
    ALL: 2,
  };

  Router.get('/user/sync', passportAuth, (req, res) => {
    const { user } = req;
    res.setHeader('Content-Type', 'application/json');
    Service.User.GetOrSetUserSync(user)
      .then((result) => {
        res.status(200).json({
          data: result,
          ensure: ENSURE.OFF,
        });
      })
      .catch((err) => {
        logError('SYNC', user, err);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  });

  Router.delete('/user/sync', passportAuth, (req, res) => {
    const { user } = req;
    Service.User.UnlockSync(user)
      .then(() => {
        res.status(200).send();
      })
      .catch((err) => {
        logError('SYNC', user, err);
        res.status(500).send({ error: 'Internal Server Error' });
      });
  });

  Router.post('/desktop/folders', passportAuth, (req, res) => {
    const folders = req.body;
    const { user } = req;

    Service.Desktop.CreateChildren(user, folders)
      .then((result) => {
        res.status(201).json(result);
      })
      .catch((err) => {
        logError('FOLDERS', user, err);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  });
};
