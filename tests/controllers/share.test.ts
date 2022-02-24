import { Request, Response } from 'express';
import { Logger } from 'winston';
import sinon, { SinonStub } from 'sinon';
import { expect } from 'chai';
import { ShareController } from '../../src/app/routes/share';

describe('Share controller', () => {

  describe('Get shared folder size', () => {

    it('should fail if `itemId` is not valid', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        params: {
          shareId: '',
          folderId: ''
        },
      }) as unknown as Request<{ shareId: string, folderId: string }>;
      const response = getResponse();

      try {
        // Act
        await controller.getSharedFolderSize(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID is not valid');
      }
    });

    it('should execute successfully when everything is fine', async () => {
      // Arrange
      const services = {
        Share: {
          getSharedFolderSize: stubOf('getSharedFolderSize')
            .resolves(99)
        },
      };
      const controller = getController(services);
      const finalParams = {
        params: {
          shareId: '',
          folderId: '1'
        },
      };
      const request = getRequest(finalParams) as unknown as Request<{ shareId: string, folderId: string }>;
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy
          };
        }
      });

      // Act
      await controller.getSharedFolderSize(request, response);

      // Assert
      expect(services.Share.getSharedFolderSize.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        size: 99
      }]);
    });

  });

  describe('Generate share file token', () => {

    const defaultBody = {
      views: '1',
      encryptionKey: 'enckey',
      fileToken: 'token',
      bucket: 'bucket',
    };

    it('should fail if `itemId` is not valid', async () => {
      await testIsErrorWithData('File ID must be a valid string', {
        params: {},
        body: defaultBody
      });
    });

    it('should fail if `views` is not valid', async () => {
      await testIsErrorWithData('Views parameter not valid', {
        params: {
          id: 'file-id'
        },
        body: {
          ...defaultBody,
          views: ''
        }
      });
    });

    it('should fail if `encryptionKey` is not valid', async () => {
      await testIsErrorWithData('Encryption key must be a valid string', {
        params: {
          id: 'file-id'
        },
        body: {
          ...defaultBody,
          encryptionKey: ''
        }
      });
    });

    it('should fail if `fileToken` is not valid', async () => {
      await testIsErrorWithData('File token must be a valid string', {
        params: {
          id: 'file-id'
        },
        body: {
          ...defaultBody,
          fileToken: ''
        }
      });
    });

    it('should fail if `bucket` is not valid', async () => {
      await testIsErrorWithData('Bucket identifier must be a valid string', {
        params: {
          id: 'file-id'
        },
        body: {
          ...defaultBody,
          bucket: ''
        }
      });
    });

    async function testIsErrorWithData(error: string, params = {}) {
      // Arrange
      const controller = getController({});
      const finalParams = {
        behalfUser: {
          email: ''
        },
        ...params
      };
      const request = getRequest(finalParams);
      const response = getResponse();

      try {
        // Act
        await controller.generateShareFileToken(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal(error);
      }
    }

    it('should execute successfully when everything is fine', async () => {
      // Arrange
      const services = {
        Share: {
          GenerateFileToken: stubOf('GenerateFileToken')
            .resolves('token')
        },
        UsersReferrals: {
          applyUserReferral: stubOf('applyUserReferral')
            .resolves()
        },
        Analytics: {
          trackShareLinkCopied: sinon.spy()
        }
      };
      const controller = getController(services);
      const finalParams = {
        behalfUser: {
          email: ''
        },
        params: {
          id: 'file-id'
        },
        body: defaultBody
      };
      const request = getRequest(finalParams);
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy
          };
        }
      });

      // Act
      await controller.generateShareFileToken(request, response);

      // Assert
      expect(services.Share.GenerateFileToken.calledOnce).to.be.true;
      expect(services.UsersReferrals.applyUserReferral.calledOnce).to.be.true;
      expect(services.Analytics.trackShareLinkCopied.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        token: 'token'
      }]);
    });

  });

  describe('Generate share folder token', () => {

    const defaultBody = {
      views: '1',
      bucketToken: 'token',
      bucket: 'bucket',
      mnemonic: 'nemo'
    };

    it('should fail if `folderId` is not valid', async () => {
      await testIsErrorWithData('Folder ID must be a valid string', {
        params: {},
        body: defaultBody
      });
    });

    it('should fail if `views` is not valid', async () => {
      await testIsErrorWithData('Views parameter not valid', {
        params: {
          id: 'file-id'
        },
        body: {
          ...defaultBody,
          views: ''
        }
      });
    });

    it('should fail if `bucketToken` is not valid', async () => {
      await testIsErrorWithData('Bucket token must be a valid string', {
        params: {
          id: 'file-id'
        },
        body: {
          ...defaultBody,
          bucketToken: ''
        }
      });
    });

    it('should fail if `bucket` is not valid', async () => {
      await testIsErrorWithData('Bucket identifier must be a valid string', {
        params: {
          id: 'file-id'
        },
        body: {
          ...defaultBody,
          bucket: ''
        }
      });
    });

    it('should fail if `mnemonic` is not valid', async () => {
      await testIsErrorWithData('Mnemonic must be a valid string', {
        params: {
          id: 'file-id'
        },
        body: {
          ...defaultBody,
          mnemonic: ''
        }
      });
    });

    async function testIsErrorWithData(error: string, params = {}) {
      // Arrange
      const controller = getController({});
      const finalParams = {
        behalfUser: {
          email: ''
        },
        ...params
      };
      const request = getRequest(finalParams);
      const response = getResponse();

      try {
        // Act
        await controller.generateShareFolderToken(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal(error);
      }
    }

    it('should execute successfully when everything is fine', async () => {
      // Arrange
      const services = {
        Share: {
          GenerateFolderToken: stubOf('GenerateFolderToken')
            .resolves('token')
        },
        Analytics: {
          trackShareLinkCopied: sinon.spy()
        }
      };
      const controller = getController(services);
      const finalParams = {
        behalfUser: {
          email: ''
        },
        params: {
          id: 'file-id'
        },
        body: defaultBody
      };
      const request = getRequest(finalParams);
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy
          };
        }
      });

      // Act
      await controller.generateShareFolderToken(request, response);

      // Assert
      expect(services.Share.GenerateFolderToken.calledOnce).to.be.true;
      expect(services.Analytics.trackShareLinkCopied.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        token: 'token'
      }]);
    });

  });

  describe('Get share file info', () => {

    it('should fail if `token` is not valid', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        params: {
          token: ''
        }
      });
      const response = getResponse();

      try {
        // Act
        await controller.getShareFileInfo(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Token must be a valid string');
      }
    });

    it('should return error if execution fails', async () => {
      // Arrange
      const services = {
        Share: {
          getFileInfo: stubOf('getFileInfo')
            .rejects({
              message: 'my-error'
            })
        },
        Analytics: {
          trackSharedLink: sinon.spy()
        }
      };
      const controller = getController(services);
      const request = getRequest({
        params: {
          token: 'sss'
        }
      });
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy
          };
        }
      });

      // Act
      await controller.getShareFileInfo(request, response);

      // Assert
      expect(services.Share.getFileInfo.calledOnce).to.be.true;
      expect(services.Analytics.trackSharedLink.calledOnce).to.be.false;
      expect(sendSpy.args[0]).to.deep.equal([{
        error: 'my-error'
      }]);
    });

    it('should execute successfully when everything is fine', async () => {
      // Arrange
      const services = {
        Share: {
          getFileInfo: stubOf('getFileInfo')
            .resolves({
              data: 'some'
            })
        },
        Analytics: {
          trackSharedLink: sinon.spy()
        }
      };
      const controller = getController(services);
      const request = getRequest({
        params: {
          token: 'sss'
        }
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy
          };
        }
      });

      // Act
      await controller.getShareFileInfo(request, response);

      // Assert
      expect(services.Share.getFileInfo.calledOnce).to.be.true;
      expect(services.Share.getFileInfo.args[0]).to.deep.equal(['sss']);
      expect(services.Analytics.trackSharedLink.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([{
        data: 'some'
      }]);
    });

  });

  describe('Get share folder info', () => {

    it('should fail if `token` is not valid', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        params: {
          token: ''
        }
      });
      const response = getResponse();

      try {
        // Act
        await controller.getShareFolderInfo(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Token must be a valid string');
      }
    });

    it('should return error if execution fails', async () => {
      // Arrange
      const services = {
        Share: {
          getFolderInfo: stubOf('getFolderInfo')
            .rejects({
              message: 'my-error'
            })
        },
      };
      const controller = getController(services);
      const request = getRequest({
        params: {
          token: 'sss'
        }
      });
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy
          };
        }
      });

      // Act
      await controller.getShareFolderInfo(request, response);

      // Assert
      expect(services.Share.getFolderInfo.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        error: 'my-error'
      }]);
    });

    it('should execute successfully when everything is fine', async () => {
      // Arrange
      const services = {
        Share: {
          getFolderInfo: stubOf('getFolderInfo')
            .resolves({
              data: 'some'
            })
        },
      };
      const controller = getController(services);
      const request = getRequest({
        params: {
          token: 'sss'
        }
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy
          };
        }
      });

      // Act
      await controller.getShareFolderInfo(request, response);

      // Assert
      expect(services.Share.getFolderInfo.calledOnce).to.be.true;
      expect(services.Share.getFolderInfo.args[0]).to.deep.equal(['sss']);
      expect(jsonSpy.args[0]).to.deep.equal([{
        data: 'some'
      }]);
    });

  });

  describe('Get shared directory files', () => {

    it('should fail if `token` is not valid', async () => {
      await testIsErrorWithData('Token must be a valid string', {
        query: {
          token: '',
          code: 'code',
          directoryId: '1',
          offset: '0',
          limit: '3',
        }
      });
    });

    it('should fail if `code` is not valid', async () => {
      await testIsErrorWithData('Code must be a valid string', {
        query: {
          token: 'token',
          code: '',
          directoryId: '1',
          offset: '2',
          limit: '3',
        }
      });
    });

    it('should fail if `directoryId` is not valid', async () => {
      await testIsErrorWithData('Directory ID is not valid', {
        query: {
          token: 'token',
          code: 'code',
          directoryId: '',
          offset: '2',
          limit: '3',
        }
      });
    });

    it('should fail if `offset` is not valid', async () => {
      await testIsErrorWithData('Offset is not valid', {
        query: {
          token: 'token',
          code: 'code',
          directoryId: '1',
          offset: '-1',
          limit: '3',
        }
      });
    });

    it('should fail if `limit` is not valid', async () => {
      await testIsErrorWithData('Limit is not valid', {
        query: {
          token: 'token',
          code: 'code',
          directoryId: '1',
          offset: '2',
          limit: '',
        }
      });
    });

    async function testIsErrorWithData(error: string, params = {}) {
      // Arrange
      const controller = getController({});
      const request = getRequest(params);
      const response = getResponse();

      try {
        // Act
        await controller.getSharedDirectoryFiles(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal(error);
      }
    }

    it('should return error if execution fails', async () => {
      // Arrange
      const services = {
        Share: {
          getSharedDirectoryFiles: stubOf('getSharedDirectoryFiles')
            .rejects({
              message: 'my-error'
            })
        },
      };
      const controller = getController(services);
      const request = getRequest({
        query: {
          token: 'token',
          code: 'code',
          directoryId: '1',
          offset: '2',
          limit: '3',
        }
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy
          };
        }
      });

      // Act
      await controller.getSharedDirectoryFiles(request, response);

      // Assert
      expect(services.Share.getSharedDirectoryFiles.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([{
        error: 'my-error'
      }]);
    });

    it('should execute successfully when everything is fine', async () => {
      // Arrange
      const services = {
        Share: {
          getSharedDirectoryFiles: stubOf('getSharedDirectoryFiles')
            .resolves({
              data: 'some'
            })
        },
      };
      const controller = getController(services);
      const request = getRequest({
        query: {
          token: 'token',
          code: 'code',
          directoryId: '1',
          offset: '2',
          limit: '3',
        }
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy
          };
        }
      });

      // Act
      await controller.getSharedDirectoryFiles(request, response);

      // Assert
      expect(services.Share.getSharedDirectoryFiles.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([{
        data: 'some'
      }]);
    });

  });

  describe('Get shared directory folders', () => {

    it('should fail if `token` is not valid', async () => {
      await testIsErrorWithData('Token must be a valid string', {
        query: {
          token: '',
          directoryId: '1',
          offset: '0',
          limit: '3',
        }
      });
    });

    it('should fail if `directoryId` is not valid', async () => {
      await testIsErrorWithData('Directory ID is not valid', {
        query: {
          token: 'token',
          directoryId: '',
          offset: '2',
          limit: '3',
        }
      });
    });

    it('should fail if `offset` is not valid', async () => {
      await testIsErrorWithData('Offset is not valid', {
        query: {
          token: 'token',
          directoryId: '1',
          offset: '-1',
          limit: '3',
        }
      });
    });

    it('should fail if `limit` is not valid', async () => {
      await testIsErrorWithData('Limit is not valid', {
        query: {
          token: 'token',
          directoryId: '1',
          offset: '2',
          limit: '',
        }
      });
    });

    async function testIsErrorWithData(error: string, params = {}) {
      // Arrange
      const controller = getController({});
      const request = getRequest(params);
      const response = getResponse();

      try {
        // Act
        await controller.getSharedDirectoryFolders(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal(error);
      }
    }

    it('should return error if execution fails', async () => {
      // Arrange
      const services = {
        Share: {
          getSharedDirectoryFolders: stubOf('getSharedDirectoryFolders')
            .rejects({
              message: 'my-error'
            })
        },
      };
      const controller = getController(services);
      const request = getRequest({
        query: {
          token: 'token',
          directoryId: '1',
          offset: '2',
          limit: '3',
        }
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy
          };
        }
      });

      // Act
      await controller.getSharedDirectoryFolders(request, response);

      // Assert
      expect(services.Share.getSharedDirectoryFolders.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([{
        error: 'my-error'
      }]);
    });

    it('should execute successfully when everything is fine', async () => {
      // Arrange
      const services = {
        Share: {
          getSharedDirectoryFolders: stubOf('getSharedDirectoryFolders')
            .resolves({
              data: 'some'
            })
        },
      };
      const controller = getController(services);
      const request = getRequest({
        query: {
          token: 'token',
          directoryId: '1',
          offset: '2',
          limit: '3',
        }
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy
          };
        }
      });

      // Act
      await controller.getSharedDirectoryFolders(request, response);

      // Assert
      expect(services.Share.getSharedDirectoryFolders.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([{
        data: 'some'
      }]);
    });

  });

  describe('Get shared folder size', () => {

    it('should fail if `itemId` is not valid', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        params: {
          shareId: '',
          folderId: ''
        },
      }) as unknown as Request<{ shareId: string, folderId: string }>;
      const response = getResponse();

      try {
        // Act
        await controller.getSharedFolderSize(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID is not valid');
      }
    });

    it('should execute successfully when everything is fine', async () => {
      // Arrange
      const services = {
        Share: {
          GenerateFolderToken: stubOf('GenerateFolderToken')
            .resolves('token')
        },
        Analytics: {
          trackShareLinkCopied: sinon.spy()
        }
      };
      const controller = getController(services);
      const finalParams = {
        behalfUser: {
          email: ''
        },
        params: {
          id: 'file-id'
        },
        body: {
          views: '1',
          bucketToken: 'token',
          bucket: 'bucket',
          mnemonic: 'nemo',
        }
      };
      const request = getRequest(finalParams);
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy
          };
        }
      });

      // Act
      await controller.generateShareFolderToken(request, response);

      // Assert
      expect(services.Share.GenerateFolderToken.calledOnce).to.be.true;
      expect(services.Analytics.trackShareLinkCopied.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        token: 'token'
      }]);
    });

  });

});

function getController(services = {}, logger = {}): ShareController {
  const defaultServices = {
    Share: {},
    UsersReferrals: {},
    Analytics: {},
  };

  const finalServices = {
    ...defaultServices,
    ...services
  };

  const defaultLogger = {
    error: () => null,
    warn: () => null
  };

  const finalLogger = {
    ...defaultLogger,
    ...logger
  } as unknown as Logger;

  return new ShareController(finalServices, finalLogger);
}

function getRequest(props = {}): Request {
  return props as unknown as Request;
}

function getResponse(props = {}): Response {
  return props as unknown as Response;
}

function stubOf(functionName: string): SinonStub {
  return sinon.stub({
    [functionName]: null
  }, functionName);
}