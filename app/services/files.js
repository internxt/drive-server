const { Environment } = require('storj');

const storj = new Environment({
  bridgeUrl: 'http://localhost:6382',
  bridgeUser: 'user10@test.com',
  bridgePass: 'asdf1234',
  encryptionKey: 'upgrade kid tissue front annual boy cannon planet auto siege gravity fence knee bid wing tired help walk mixture rally grass human acoustic basic',
  logLevel: 4
})

module.exports = (Model, App) => {
  const Upload = (fileName, filePath, bucketId) => {
    return new Promise((resolve, reject) => {
      storj.storeFile(bucketId, filePath, {
        filename: fileName,
        progressCallback(progress, downloadedBytes, totalBytes) {
          App.logger.info('progress:', progress);
          App.logger.info('totalBytes:', totalBytes);
        },
        finishedCallback(err, fileId) {
          if (err) {
            App.logger.info(err);
            reject(err)
          }
          App.logger.info('File complete:', fileId);
          resolve(fileId)
        }
      });
    });
  }

  const ListAllFiles = (bucketId) => {
    return new Promise((resolve, reject) => {
      storj.listFiles(bucketId, function(err, result) {
        if (err) {
          reject(err)
        }
        resolve(result)
      })
    })
  }

  return {
    Name: 'Files',
    Upload,
    ListAllFiles
  }
}
