import { Request, Response } from 'express';
import { StorageController } from '../../src/app/routes/storage-v2';
import { Logger } from 'winston';
import sinon, { SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Storage controller', () => {

  describe('Create file', () => {

    it('should fail if `fileId` is not given', async () => {
      // Arrange
      const loggerError = sinon.spy();
      const controller = getController({}, {
        error: loggerError
      });
      const request = getRequest({
        behalfUser: {
          email: ''
        },
        body: {
          file: {
            bucket: '--',
            size: '--',
            folder_id: '--',
            name: '--',
          }
        },
        headers: {
          'internxt-client': '',
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
      await controller.createFile(request, response);

      // Assert
      expect(loggerError.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
    });

    it('should fail if `bucket` is not given', async () => {
      // Arrange
      const loggerError = sinon.spy();
      const controller = getController({}, {
        error: loggerError
      });
      const request = getRequest({
        behalfUser: {
          email: ''
        },
        body: {
          file: {
            fileId: '--',
            size: '--',
            folder_id: '--',
            name: '--',
          }
        },
        headers: {
          'internxt-client': '',
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
      await controller.createFile(request, response);

      // Assert
      expect(loggerError.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
    });

    it('should fail if `size` is not given', async () => {
      // Arrange
      const loggerError = sinon.spy();
      const controller = getController({}, {
        error: loggerError
      });
      const request = getRequest({
        behalfUser: {
          email: ''
        },
        body: {
          file: {
            fileId: '--',
            bucket: '--',
            folder_id: '--',
            name: '--',
          }
        },
        headers: {
          'internxt-client': '',
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
      await controller.createFile(request, response);

      // Assert
      expect(loggerError.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
    });

    it('should fail if `folder_id` is not given', async () => {
      // Arrange
      const loggerError = sinon.spy();
      const controller = getController({}, {
        error: loggerError
      });
      const request = getRequest({
        behalfUser: {
          email: ''
        },
        body: {
          file: {
            fileId: '--',
            bucket: '--',
            size: '--',
            name: '--',
          }
        },
        headers: {
          'internxt-client': '',
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
      await controller.createFile(request, response);

      // Assert
      expect(loggerError.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
    });

    it('should fail if `name` is not given', async () => {
      // Arrange
      const loggerError = sinon.spy();
      const controller = getController({}, {
        error: loggerError
      });
      const request = getRequest({
        behalfUser: {
          email: ''
        },
        body: {
          file: {
            fileId: '--',
            bucket: '--',
            size: '--',
            folder_id: '--',
          }
        },
        headers: {
          'internxt-client': '',
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
      await controller.createFile(request, response);

      // Assert
      expect(loggerError.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
    });

    it('should work fine if all params are given', async () => {
      // Arrange
      const services = {
        Files: {
          CreateFile: sinon.spy()
        },
        Analytics: {
          trackUploadCompleted: sinon.spy()
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers')
            .resolves([{}, {}])
        },
        Notifications: {
          fileCreated: sinon.spy()
        }
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          email: ''
        },
        body: {
          file: {
            fileId: '1',
            bucket: '2',
            size: '3',
            folder_id: '4',
            name: '5',
          }
        },
        headers: {
          'internxt-client': '',
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
      await controller.createFile(request, response);

      // Assert
      expect(services.Files.CreateFile.calledOnce).to.be.true;
      expect(services.Analytics.trackUploadCompleted.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.fileCreated.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
    });

    it('should work as fine if `file_id` is given instead of `fileId`', async () => {
      // Arrange
      const services = {
        Files: {
          CreateFile: sinon.spy()
        },
        Analytics: {
          trackUploadCompleted: sinon.spy()
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers')
            .resolves([{}, {}])
        },
        Notifications: {
          fileCreated: sinon.spy()
        }
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          email: '',
          id: ''
        },
        body: {
          file: {
            file_id: '1',
            bucket: '2',
            size: '3',
            folder_id: '4',
            name: '5',
          }
        },
        headers: {
          'internxt-client': '',
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
      await controller.createFile(request, response);

      // Assert
      expect(services.Files.CreateFile.calledOnce).to.be.true;
      expect(services.Analytics.trackUploadCompleted.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.fileCreated.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
    });

    it('should apply user referral if mobile client', async () => {
      // Arrange
      const services = {
        Files: {
          CreateFile: sinon.spy()
        },
        Analytics: {
          trackUploadCompleted: sinon.spy()
        },
        UsersReferrals: {
          applyUserReferral: stubOf('applyUserReferral')
            .resolves()
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers')
            .resolves([{}, {}])
        },
        Notifications: {
          fileCreated: sinon.spy()
        }
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          email: 'email',
          id: 'id'
        },
        body: {
          file: {
            file_id: '1',
            bucket: '2',
            size: '3',
            folder_id: '4',
            name: '5',
          }
        },
        headers: {
          'internxt-client': 'drive-mobile',
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
      await controller.createFile(request, response);

      // Assert
      expect(services.Files.CreateFile.calledOnce).to.be.true;
      expect(services.Analytics.trackUploadCompleted.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.fileCreated.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(services.UsersReferrals.applyUserReferral.calledOnce).to.be.true;
      expect(services.UsersReferrals.applyUserReferral.args[0]).to.deep.equal(['id', 'install-mobile-app']);
    });

    it('should apply user referral if desktop client', async () => {
      // Arrange
      const services = {
        Files: {
          CreateFile: sinon.spy()
        },
        Analytics: {
          trackUploadCompleted: sinon.spy()
        },
        UsersReferrals: {
          applyUserReferral: stubOf('applyUserReferral')
            .resolves()
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers')
            .resolves([{}, {}])
        },
        Notifications: {
          fileCreated: sinon.spy()
        }
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          email: 'email',
          id: 'id'
        },
        body: {
          file: {
            file_id: '1',
            bucket: '2',
            size: '3',
            folder_id: '4',
            name: '5',
          }
        },
        headers: {
          'internxt-client': 'drive-desktop',
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
      await controller.createFile(request, response);

      // Assert
      expect(services.Files.CreateFile.calledOnce).to.be.true;
      expect(services.Analytics.trackUploadCompleted.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.fileCreated.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(services.UsersReferrals.applyUserReferral.calledOnce).to.be.true;
      expect(services.UsersReferrals.applyUserReferral.args[0]).to.deep.equal(['id', 'install-desktop-app']);
    });


  });

  describe('Create folder', () => {

    it('should fail if folder name is not valid', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        user: {
          email: ''
        },
        body: {
          folderName: '',
          parentFolderId: 10
        },
        headers: {}
      });
      const response = getResponse();

      try {
        // Act
        await controller.createFolder(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder name must be a valid string');
      }
    });

    it('should fail if parent folder ID is not valid', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        user: {
          email: ''
        },
        body: {
          folderName: 'name',
          parentFolderId: 0
        },
        headers: {}
      });
      const response = getResponse();

      try {
        // Act
        await controller.createFolder(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Parent folder ID is not valid');
      }
    });

    it('should return error if creation fails', async () => {
      // Arrange
      const services = {
        Folder: {
          Create: stubOf('Create')
            .rejects({
              message: 'my-error'
            })
        }
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          email: ''
        },
        body: {
          folderName: 'name',
          parentFolderId: 10
        },
        headers: {}
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
      await controller.createFolder(request, response);

      // Assert
      expect(services.Folder.Create.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([{
        error: 'my-error'
      }]);
    });

    it('should execute successful complete creation when everything is fine', async () => {
      // Arrange
      const services = {
        Folder: {
          Create: stubOf('Create')
            .resolves({
              data: 'some'
            })
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers')
            .resolves([{}, {}])
        },
        Notifications: {
          folderCreated: sinon.spy()
        }
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          email: ''
        },
        body: {
          folderName: 'name',
          parentFolderId: 10
        },
        headers: {}
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
      await controller.createFolder(request, response);

      // Assert
      expect(services.Folder.Create.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.folderCreated.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([{
        data: 'some'
      }]);
    });

  });

  describe('Generate share file token', () => {

    it('should fail if `itemId` is not valid', async () => {
      await testIsErrorWithData('File ID must be a valid string', {
        params: {},
        body: {
          views: '1',
          encryptionKey: 'enckey',
          fileToken: 'token',
          bucket: 'bucket',
        }
      });
    });

    it('should fail if `views` is not valid', async () => {
      await testIsErrorWithData('Views parameter not valid', {
        params: {
          id: 'file-id'
        },
        body: {
          encryptionKey: 'enckey',
          fileToken: 'token',
          bucket: 'bucket',
        }
      });
    });

    it('should fail if `encryptionKey` is not valid', async () => {
      await testIsErrorWithData('Encryption key must be a valid string', {
        params: {
          id: 'file-id'
        },
        body: {
          views: '1',
          fileToken: 'token',
          bucket: 'bucket',
        }
      });
    });

    it('should fail if `fileToken` is not valid', async () => {
      await testIsErrorWithData('File token must be a valid string', {
        params: {
          id: 'file-id'
        },
        body: {
          views: '1',
          encryptionKey: 'enckey',
          bucket: 'bucket',
        }
      });
    });

    it('should fail if `bucket` is not valid', async () => {
      await testIsErrorWithData('Bucket identifier must be a valid string', {
        params: {
          id: 'file-id'
        },
        body: {
          views: '1',
          encryptionKey: 'enckey',
          fileToken: 'token',
        }
      });
    });

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
        body: {
          views: '1',
          encryptionKey: 'enckey',
          fileToken: 'token',
          bucket: 'bucket',
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
      await controller.generateShareFileToken(request, response);

      // Assert
      expect(services.Share.GenerateFileToken.calledOnce).to.be.true;
      expect(services.UsersReferrals.applyUserReferral.calledOnce).to.be.true;
      expect(services.Analytics.trackShareLinkCopied.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        token: 'token'
      }]);
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
      } catch ({ message }) {
        // Assert
        expect(message).to.equal(error);
      }
    }

  });

  describe('Generate folder tree', () => {

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          GetTree: stubOf('GetTree')
            .rejects({
              message: 'my-error'
            })
        },
      };
      const controller = getController(services);
      const finalParams = {
        user: {},
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
      await controller.getTree(request, response);

      // Assert
      expect(services.Folder.GetTree.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        error: 'my-error'
      }]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          GetTree: stubOf('GetTree')
            .resolves({
              value: 'any'
            })
        },
      };
      const controller = getController(services);
      const finalParams = {
        user: {},
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
      await controller.getTree(request, response);

      // Assert
      expect(services.Folder.GetTree.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        value: 'any'
      }]);
    });

  });

  describe('Generate folder tree of a specific folder', () => {

    it('should fail if `folderId` is not valid', async () => {
      // Arrange
      const controller = getController();
      const finalParams = {
        user: {},
        params: {
          folderId: ''
        }
      };
      const request = getRequest(finalParams);
      const response = getResponse();

      try {

        // Act
        await controller.getTreeSpecific(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          GetTree: stubOf('GetTree')
            .rejects({
              message: 'my-error'
            })
        },
      };
      const controller = getController(services);
      const finalParams = {
        user: {},
        params: {
          folderId: '1'
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
      await controller.getTreeSpecific(request, response);

      // Assert
      expect(services.Folder.GetTree.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        error: 'my-error'
      }]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          GetTree: stubOf('GetTree')
            .resolves({
              value: 'any'
            }),
          GetTreeSize: stubOf('GetTreeSize')
            .returns(999),
        },
      };
      const controller = getController(services);
      const finalParams = {
        user: {},
        params: {
          folderId: '1'
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
      await controller.getTreeSpecific(request, response);

      // Assert
      expect(services.Folder.GetTree.calledOnce).to.be.true;
      expect(services.Folder.GetTreeSize.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        tree: {
          value: 'any'
        },
        size: 999
      }]);
    });

  });

  describe('Delete folder', () => {

    it('should fail if missing param `id`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          id: ''
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.deleteFolder(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID param is not valid');
      }
    });

    it('should fail if missing header client-id', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '1'
        },
        headers: {}
      });
      const response = getResponse();

      try {
        // Act
        await controller.deleteFolder(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Missing header internxt-client-id');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          Delete: stubOf('Delete')
            .rejects({
              message: 'my-error'
            }),
        }
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '1'
        },
        headers: {
          'internxt-client-id': 'wever'
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
      await controller.deleteFolder(request, response);

      // Assert
      expect(services.Folder.Delete.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        error: 'my-error'
      }]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          Delete: stubOf('Delete')
            .resolves({
              some: 'data'
            }),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers')
            .resolves([
              {}, {}
            ]),
        },
        Notifications: {
          folderDeleted: sinon.spy()
        }
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '1'
        },
        headers: {
          'internxt-client-id': 'wever'
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
      await controller.deleteFolder(request, response);

      // Assert
      expect(services.Folder.Delete.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.folderDeleted.calledTwice).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([{
        some: 'data'
      }]);
    });

  });

  describe('Move folder', () => {

    it('should fail if missing param `folderId`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        body: {
          folderId: '',
          destination: '2'
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.moveFolder(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID is not valid');
      }
    });

    it('should fail if missing param `destination`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        body: {
          folderId: '2',
          destination: ''
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.moveFolder(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Destination folder ID is not valid');
      }
    });

    it('should fail if missing header client-id', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        body: {
          folderId: '2',
          destination: '3'
        },
        headers: {}
      });
      const response = getResponse();

      try {
        // Act
        await controller.moveFolder(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Missing header internxt-client-id');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          MoveFolder: stubOf('MoveFolder')
            .rejects({
              message: 'my-error'
            }),
        }
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        body: {
          folderId: '1',
          destination: '2'
        },
        headers: {
          'internxt-client-id': 'wever'
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
      await controller.moveFolder(request, response);

      // Assert
      expect(services.Folder.MoveFolder.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([{
        error: 'my-error'
      }]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          MoveFolder: stubOf('MoveFolder')
            .resolves({
              result: {
                some: 'data'
              }
            }),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers')
            .resolves([
              {}, {}
            ]),
        },
        Notifications: {
          folderUpdated: sinon.spy()
        }
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        body: {
          folderId: '1',
          destination: '2'
        },
        headers: {
          'internxt-client-id': 'wever'
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
      await controller.moveFolder(request, response);

      // Assert
      expect(services.Folder.MoveFolder.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.folderUpdated.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([{
        some: 'data'
      }]);
    });

  });

});


function getController(services = {}, logger = {}): StorageController {
  const defaultServices = {
    Files: {},
    Folder: {},
    UsersReferrals: {},
    Analytics: {},
    User: {},
    Notifications: {},
    Share: {}
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

  return new StorageController(finalServices, finalLogger);
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