const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const rimraf = require('rimraf');
const fs = require('fs');

function initShareListener(App, Service, socket) {
  socket.on('get-file-share', (content) => {
    if (content.token) {
      Service.Share.FindOne(content.token).then((result) => {
        Service.User.FindUserByEmail(result.user).then((userData) => {
          const fileIdInBucket = result.file;
          const isFolder = result.is_folder;

          userData.mnemonic = result.mnemonic;

          if (isFolder) {
            Service.Folder.GetTree({
              email: result.user
            }, result.file).then((tree) => {
              const maxAcceptableSize = 1024 * 1024 * 300; // 300MB
              const treeSize = Service.Folder.GetTreeSize(tree);

              if (treeSize <= maxAcceptableSize) {
                socket.emit(`get-file-share-${content.token}-length`, treeSize);

                Service.Folder.Download(tree, userData).then(() => {
                  const folderName = App.services.Crypt.decryptName(tree.name,
                    tree.parentId);

                  socket.emit(`get-file-share-${content.token}-fileName`, `${folderName}.zip`);

                  Service.Folder.CreateZip(`./downloads/${tree.id}/${folderName}.zip`,
                    [`downloads/${tree.id}/${folderName}`]);

                  const fileStream = fs.createReadStream(`./downloads/${tree.id}/${folderName}.zip`);

                  fileStream.on('data', (chunk) => {
                    socket.emit(`get-file-share-${content.token}-stream`, chunk);
                  });

                  fileStream.on('end', () => {
                    socket.emit(`get-file-share-${content.token}-finished`);
                    rimraf(`./downloads/${tree.id}`);
                  });

                  fileStream.on('error', (err) => {
                    console.log(err);
                    socket.emit(`get-file-share-${content.token}-error`);
                    rimraf(`./downloads/${tree.id}`);
                  });
                }).catch((err) => {
                  if (fs.existsSync(`./downloads/${tree.id}`)) {
                    rimraf(`./downloads/${tree.id}`);
                  }

                  console.log(err);
                  socket.emit(`get-file-share-${content.token}-error`);
                });
              } else {
                console.log('file too large');
                socket.emit(`get-file-share-${content.token}-error`);
              }
            }).catch((err) => {
              console.log(err);
              console.log('Error downloading folder');
              socket.emit(`get-file-share-${content.token}-error`);
            });
          } else {
            socket.emit(`get-file-share-${content.token}-step-downloading-from-net`);

            Service.Files.Download(userData, fileIdInBucket).then(({
              filestream, downloadFile, folderId, name, type, size
            }) => {
              socket.emit(`get-file-share-${content.token}-step-decrypting`);
              socket.emit(`get-file-share-${content.token}-length`, size);

              const decryptedFileName = App.services.Crypt.decryptName(name, folderId);
              const fileName = `${decryptedFileName}${type ? `.${type}` : ''}`;

              socket.emit(`get-file-share-${content.token}-fileName`, fileName);

              filestream.on('data', (chunk) => {
                socket.emit(`get-file-share-${content.token}-stream`, chunk);
              });

              filestream.on('end', () => {
                socket.emit(`get-file-share-${content.token}-finished`);
                fs.unlink(downloadFile, (error) => {
                  if (error) throw error;
                });
              });

              filestream.on('error', (err) => {
                console.log(err);
                socket.emit(`get-file-share-${content.token}-error`);
                fs.unlink(downloadFile, (error) => {
                  if (error) throw error;
                });
              });
            }).catch(({ message }) => {
              if (message === 'Bridge rate limit error') {
                console.log('Bridge rate limit error');
                socket.emit(`get-file-share-${content.token}-error`);
                return;
              }
              socket.emit(`get-file-share-${content.token}-error`, message);
            });
          }
        }).catch((err) => {
          console.log(err);
          console.log('User not found');
          socket.emit(`get-file-share-${content.token}-error`);
        });
      }).catch((err) => {
        console.log(err);
        console.log('Invalid token');
        socket.emit(`get-file-share-${content.token}-error`);
      });
    }
  });
}

function initSocketServer(Service, App) {
  const app = express();
  const server = http.createServer(app);
  const socketServer = socketIo(server, {
    cors: {
      origin: 'http://localhost:3000'
    }
  });

  socketServer.on('connection', (socket) => {
    console.log('Socket connected');
    initShareListener(App, Service, socket);
  });

  server.listen(8001);
}



module.exports = { initSocketServer };
