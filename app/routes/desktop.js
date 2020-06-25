const { passportAuth } = require('../middleware/passport');
const useragent = require('useragent')
const path = require('path')
const async = require('async')

module.exports = (Router, Service, Logger, App) => {
  Router.get('/storage/tree', passportAuth, function (req, res) {
    const { user } = req;
    const agent = useragent.parse(req.headers['user-agent']);

    if (agent && agent.family === 'Electron') {
      Service.Statistics.Insert({
        name: 'X Cloud Desktop',
        user: user.email,
        userAgent: agent.source,
      })
        .then(() => { })
        .catch((err) => {
          console.log('Error creating statistics:', err);
        });
    }

    Service.User.UpdateAccountActivity(user.email);

    Service.Folder.GetTree(user)
      .then((result) => {
        res.status(200).send(result);
      })
      .catch((err) => {
        res.status(500).send({ error: err.message });
      });
  });

  Router.put('/user/sync', passportAuth, function (req, res) {
    const { user, body } = req;
    res.setHeader('Content-Type', 'application/json');
    Service.User.UpdateUserSync(user.email, body.toNull)
      .then((result) => {
        res.status(200).json({ data: result });
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  });

  Router.get('/user/sync', passportAuth, function (req, res) {
    const { user } = req;
    res.setHeader('Content-Type', 'application/json');
    Service.User.GetOrSetUserSync(user.email)
      .then((result) => {
        res.status(200).json({ data: result });
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  });

  Router.get('/storage/exists', passportAuth, function (req, res) {
    const rootFolderId = req.user.root_folder_id
    let targetPath = req.body.path

    // Create subdirectories if not exists
    const mkdirp = !!req.body.mkdirp

    const findFile = !!req.body.isFile

    // win32 normalization converts all "/" to "\". Posix doesn't
    targetPath = path.win32.normalize(targetPath)

    if (targetPath.substring(0, 1) === '.') {
      return res.status(401).send({ error: 'Invalid path' })
    }

    let splitted = targetPath.split('\\')
    splitted = splitted.filter(e => e !== '')

    const GetChildren = async (folderId, match) => {
      return new Promise((resolve, reject) => {
        Service.Folder.GetChildren(req.user, folderId).then(result => {
          async.eachSeries(result, (folder, nextItem) => {
            const name = Service.Crypt.decryptName(folder.name, folderId)
            if (name === match) {
              nextItem(folder)
            } else {
              nextItem()
            }
          }, (err) => {
            if (err) {
              if (typeof err === 'object') { resolve(err) } else { reject(err) }
            } else {
              reject()
            }
          })
        })
      })
    }

    const GetFiles = async (folderId, match) => {
      // console.log('GET FILES')
      return new Promise((resolve, reject) => {
        Service.Folder.GetContent(folderId, req.user).then(result => {
          async.eachSeries(result.files, (file, nextFile) => {
            const fileName = file.name + (file.type ? '.' + file.type : '')
            if (fileName === match) {
              // console.log('MATCH')
              nextFile(file)
            } else {
              // console.log('No match %s', fileName)
              nextFile()
            }
          }, (err) => {
            if (err) {
              if (typeof err == 'object') { resolve(err) } else { reject(err) }
            } else {
              reject()
            }
          })
        })
      })
    }

    let lastFolderId = rootFolderId
    let i = 0
    async.eachSeries(splitted, (targetFolder, nextFolder) => {
      // console.log('Searching for %s on folder %s', targetFolder, lastFolderId)
      const isLastElement = i === splitted.length - 1
      i++

      (!isLastElement || !findFile) && GetChildren(lastFolderId, targetFolder).then(result => {
        lastFolderId = result.id
        nextFolder()
      }).catch(err => {
        if (mkdirp) {
          Service.Folder.Create(req.user, targetFolder, lastFolderId).then(result => {
            lastFolderId = result.id
            nextFolder()
          }).catch(err => {
            nextFolder(err)
          })
        } else {
          nextFolder(Error('Folder does not exists'))
        }
      })

      isLastElement && findFile && GetFiles(lastFolderId, targetFolder).then(result => {
        nextFolder()
      }).catch(err => {
        nextFolder(Error('File does not exists'))
      })

    }, (err) => {
      // console.log('FIN')
      if (err) {
        res.status(401).send({ error: err.message })
      } else {
        res.status(200).send({ result: 'ok' })
      }
    })
  });
};
