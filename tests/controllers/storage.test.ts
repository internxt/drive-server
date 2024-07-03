import { Request, Response } from 'express';
import { StorageController } from '../../src/app/routes/storage';
import { Logger } from 'winston';
import sinon, { SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Storage controller', () => {
  describe('Create file', () => {
    it('should fail if `fileId` is not given', async () => {
      // Arrange
      const loggerError = sinon.spy();
      const controller = getController(
        {},
        {
          error: loggerError,
        },
      );
      const request = getRequest({
        behalfUser: {
          email: '',
        },
        body: {
          file: {
            bucket: '--',
            size: '--',
            folder_id: '--',
            name: '--',
          },
        },
        headers: {
          'internxt-client': '',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
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
      const controller = getController(
        {},
        {
          error: loggerError,
        },
      );
      const request = getRequest({
        behalfUser: {
          email: '',
        },
        body: {
          file: {
            fileId: '--',
            size: '--',
            folder_id: '--',
            name: '--',
          },
        },
        headers: {
          'internxt-client': '',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
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
      const controller = getController(
        {},
        {
          error: loggerError,
        },
      );
      const request = getRequest({
        behalfUser: {
          email: '',
        },
        body: {
          file: {
            fileId: '--',
            bucket: '--',
            folder_id: '--',
            name: '--',
          },
        },
        headers: {
          'internxt-client': '',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
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
      const controller = getController(
        {},
        {
          error: loggerError,
        },
      );
      const request = getRequest({
        behalfUser: {
          email: '',
        },
        body: {
          file: {
            fileId: '--',
            bucket: '--',
            size: '--',
            name: '--',
          },
        },
        headers: {
          'internxt-client': '',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
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
      const controller = getController(
        {},
        {
          error: loggerError,
        },
      );
      const request = getRequest({
        behalfUser: {
          email: '',
        },
        body: {
          file: {
            fileId: '--',
            bucket: '--',
            size: '--',
            folder_id: '--',
          },
        },
        headers: {
          'internxt-client': '',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
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
          CreateFile: sinon.spy(),
        },
        Analytics: {
          trackUploadCompleted: sinon.spy(),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        },
        Notifications: {
          fileCreated: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          email: '',
        },
        body: {
          file: {
            fileId: '1',
            bucket: '2',
            size: '3',
            folder_id: '4',
            name: '5',
          },
        },
        headers: {
          'internxt-client': '',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.createFile(request, response);

      // Assert
      expect(services.Files.CreateFile.calledOnce).to.be.true;
      expect(services.Analytics.trackUploadCompleted.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.fileCreated.calledTwice).to.be.true;
      expect(services.Apn.sendStorageNotification.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
    });

    it('should work as fine if `file_id` is given instead of `fileId`', async () => {
      // Arrange
      const services = {
        Files: {
          CreateFile: sinon.spy(),
        },
        Analytics: {
          trackUploadCompleted: sinon.spy(),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        },
        Notifications: {
          fileCreated: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          email: '',
          id: '',
        },
        body: {
          file: {
            file_id: '1',
            bucket: '2',
            size: '3',
            folder_id: '4',
            name: '5',
          },
        },
        headers: {
          'internxt-client': '',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.createFile(request, response);

      // Assert
      expect(services.Files.CreateFile.calledOnce).to.be.true;
      expect(services.Analytics.trackUploadCompleted.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.fileCreated.calledTwice).to.be.true;
      expect(services.Apn.sendStorageNotification.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
    });

    it('should apply user referral if mobile client', async () => {
      // Arrange
      const services = {
        Files: {
          CreateFile: sinon.spy(),
        },
        Analytics: {
          trackUploadCompleted: sinon.spy(),
        },
        UsersReferrals: {
          applyUserReferral: stubOf('applyUserReferral').resolves(),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        },
        Notifications: {
          fileCreated: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          email: 'email',
          id: 'id',
        },
        body: {
          file: {
            file_id: '1',
            bucket: '2',
            size: '3',
            folder_id: '4',
            name: '5',
          },
        },
        headers: {
          'internxt-client': 'drive-mobile',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.createFile(request, response);

      // Assert
      expect(services.Files.CreateFile.calledOnce).to.be.true;
      expect(services.Analytics.trackUploadCompleted.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.fileCreated.calledTwice).to.be.true;
      expect(services.Apn.sendStorageNotification.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(services.UsersReferrals.applyUserReferral.calledOnce).to.be.true;
      expect(services.UsersReferrals.applyUserReferral.args[0]).to.deep.equal(['id', 'install-mobile-app']);
    });

    it('should apply user referral if desktop client', async () => {
      // Arrange
      const services = {
        Files: {
          CreateFile: sinon.spy(),
        },
        Analytics: {
          trackUploadCompleted: sinon.spy(),
        },
        UsersReferrals: {
          applyUserReferral: stubOf('applyUserReferral').resolves(),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        },
        Notifications: {
          fileCreated: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          email: 'email',
          id: 'id',
        },
        body: {
          file: {
            file_id: '1',
            bucket: '2',
            size: '3',
            folder_id: '4',
            name: '5',
          },
        },
        headers: {
          'internxt-client': 'drive-desktop',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.createFile(request, response);

      // Assert
      expect(services.Files.CreateFile.calledOnce).to.be.true;
      expect(services.Analytics.trackUploadCompleted.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.fileCreated.calledTwice).to.be.true;
      expect(services.Apn.sendStorageNotification.calledTwice).to.be.true;
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
          email: '',
        },
        body: {
          folderName: '',
          parentFolderId: 10,
        },
        headers: {},
      });
      const response = getResponse();

      try {
        // Act
        await controller.createFolder(request, response);
        expect(true).to.be.false;
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
          email: '',
        },
        body: {
          folderName: 'name',
          parentFolderId: 0,
        },
        headers: {},
      });
      const response = getResponse();

      try {
        // Act
        await controller.createFolder(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Parent folder ID is not valid');
      }
    });

    it('should return error if creation fails', async () => {
      // Arrange
      const services = {
        Folder: {
          Create: stubOf('Create').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          email: '',
        },
        body: {
          folderName: 'name',
          parentFolderId: 10,
        },
        headers: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.createFolder(request, response);

      // Assert
      expect(services.Folder.Create.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          error: 'my-error',
        },
      ]);
    });

    it('should execute successful complete creation when everything is fine', async () => {
      // Arrange
      const services = {
        Folder: {
          Create: stubOf('Create').resolves({
            data: 'some',
          }),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        },
        Notifications: {
          folderCreated: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          email: '',
        },
        body: {
          folderName: 'name',
          parentFolderId: 10,
        },
        headers: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.createFolder(request, response);

      // Assert
      expect(services.Folder.Create.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.folderCreated.calledTwice).to.be.true;
      expect(services.Apn.sendStorageNotification.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          data: 'some',
        },
      ]);
    });
  });

  describe('Generate folder tree', () => {
    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          GetTree: stubOf('GetTree').rejects({
            message: 'my-error',
          }),
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
            send: sendSpy,
          };
        },
      });

      // Act
      await controller.getTree(request, response);

      // Assert
      expect(services.Folder.GetTree.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([
        {
          error: 'my-error',
        },
      ]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          GetTree: stubOf('GetTree').resolves({
            value: 'any',
          }),
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
            send: sendSpy,
          };
        },
      });

      // Act
      await controller.getTree(request, response);

      // Assert
      expect(services.Folder.GetTree.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([
        {
          value: 'any',
        },
      ]);
    });
  });

  describe('Generate folder tree of a specific folder', () => {
    it('should fail if `folderId` is not valid', async () => {
      // Arrange
      const controller = getController();
      const finalParams = {
        user: {},
        params: {
          folderId: '',
        },
      };
      const request = getRequest(finalParams);
      const response = getResponse();

      try {
        // Act
        await controller.getTreeSpecific(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          GetTree: stubOf('GetTree').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const finalParams = {
        user: {},
        params: {
          folderId: '1',
        },
      };
      const request = getRequest(finalParams);
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy,
          };
        },
      });

      // Act
      await controller.getTreeSpecific(request, response);

      // Assert
      expect(services.Folder.GetTree.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([
        {
          error: 'my-error',
        },
      ]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          GetTree: stubOf('GetTree').resolves({
            value: 'any',
          }),
          GetTreeSize: stubOf('GetTreeSize').returns(999),
        },
      };
      const controller = getController(services);
      const finalParams = {
        user: {},
        params: {
          folderId: '1',
        },
      };
      const request = getRequest(finalParams);
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy,
          };
        },
      });

      // Act
      await controller.getTreeSpecific(request, response);

      // Assert
      expect(services.Folder.GetTree.calledOnce).to.be.true;
      expect(services.Folder.GetTree.args[0]).to.deep.equal([{}, '1']);
      expect(services.Folder.GetTreeSize.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([
        {
          tree: {
            value: 'any',
          },
          size: 999,
        },
      ]);
    });
  });

  describe('Delete folder', () => {
    it('should fail if missing param `id`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.deleteFolder(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID param is not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          Delete: stubOf('Delete').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '1',
        },
        headers: {},
      });
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy,
          };
        },
      });

      // Act
      await controller.deleteFolder(request, response);

      // Assert
      expect(services.Folder.Delete.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([
        {
          error: 'my-error',
        },
      ]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          Delete: stubOf('Delete').resolves({
            some: 'data',
          }),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: stubOf('getUserNotificationTokens').resolves([{ token: 'token' }]),
        },
        Notifications: {
          folderDeleted: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '1',
        },
        headers: {},
      });
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy,
          };
        },
      });

      // Act
      await controller.deleteFolder(request, response);

      // Assert
      expect(services.Folder.Delete.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.folderDeleted.calledTwice).to.be.true;
      expect(services.Apn.sendStorageNotification.calledTwice).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([
        {
          some: 'data',
        },
      ]);
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
          destination: '2',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.moveFolder(request, response);
        expect(true).to.be.false;
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
          destination: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.moveFolder(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Destination folder ID is not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          MoveFolder: stubOf('MoveFolder').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        body: {
          folderId: '1',
          destination: '2',
        },
        headers: {},
      });
      const sendStatusSpy = sinon.spy();
      const response = getResponse({
        sendStatus: sendStatusSpy,
      });

      // Act
      await controller.moveFolder(request, response);

      // Assert
      expect(services.Folder.MoveFolder.calledOnce).to.be.true;
      expect(sendStatusSpy.calledOnce).to.be.true;
      expect(sendStatusSpy.calledWithExactly(500)).to.be.true;
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          MoveFolder: stubOf('MoveFolder').resolves({
            result: {
              some: 'data',
            },
            other: {
              some: 'more',
            },
          }),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        },
        Notifications: {
          folderUpdated: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        body: {
          folderId: '1',
          destination: '2',
        },
        headers: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.moveFolder(request, response);

      // Assert
      expect(services.Folder.MoveFolder.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.folderUpdated.calledTwice).to.be.true;
      expect(services.Apn.sendStorageNotification.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          result: {
            some: 'data',
          },
          other: {
            some: 'more',
          },
        },
      ]);
    });
  });

  describe('Update folder', () => {
    it('should fail if missing param `folderId`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          folderid: '',
        },
        body: {
          metadata: {},
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.updateFolder(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID is not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          UpdateMetadata: stubOf('UpdateMetadata').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          folderid: '2',
        },
        body: {
          metadata: {},
        },
        headers: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.updateFolder(request, response);

      // Assert
      expect(services.Folder.UpdateMetadata.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal(['my-error']);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          UpdateMetadata: stubOf('UpdateMetadata').resolves({
            result: {
              some: 'data',
            },
          }),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        },
        Notifications: {
          folderUpdated: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          folderid: '2',
        },
        body: {
          metadata: {},
        },
        headers: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.updateFolder(request, response);

      // Assert
      expect(services.Folder.UpdateMetadata.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.folderUpdated.calledTwice).to.be.true;
      expect(services.Apn.sendStorageNotification.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          result: {
            some: 'data',
          },
        },
      ]);
    });
  });

  describe('Get folder contents', () => {
    it('should fail if missing param `id`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.getFolderContents(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID is not valid');
      }
    });

    it('should fail if first method fails', async () => {
      // Arrange
      const services = {
        Folder: {
          getById: stubOf('getById').rejects({
            message: 'my-error',
          }),
          getFolders: stubOf('getById').resolves(),
        },
        Files: {
          getByFolderAndUserId: stubOf('getByFolderAndUserId').resolves(),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '2',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.getFolderContents(request, response);

      // Assert
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          error: 'my-error',
        },
      ]);
    });

    it('should fail if second method fails', async () => {
      // Arrange
      const services = {
        Folder: {
          getById: stubOf('getById').resolves(),
          getFolders: stubOf('getById').rejects({
            message: 'my-error',
          }),
        },
        Files: {
          getByFolderAndUserId: stubOf('getByFolderAndUserId').resolves(),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '2',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.getFolderContents(request, response);

      // Assert
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          error: 'my-error',
        },
      ]);
    });

    it('should fail if third method fails', async () => {
      // Arrange
      const services = {
        Folder: {
          getById: stubOf('getById').resolves(),
          getFolders: stubOf('getById').resolves(),
        },
        Files: {
          getByFolderAndUserId: stubOf('getByFolderAndUserId').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '2',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.getFolderContents(request, response);

      // Assert
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          error: 'my-error',
        },
      ]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          getById: stubOf('getById').resolves({
            data: 'some',
          }),
          getFolders: stubOf('getById').resolves([{}, {}]),
        },
        Files: {
          getByFolderAndUserId: stubOf('getByFolderAndUserId').resolves([{}]),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          id: '2',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.getFolderContents(request, response);

      // Assert
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          data: 'some',
          children: [{}, {}],
          files: [{}],
        },
      ]);
    });

    it('should execute fine when no error with trash', async () => {
      // Arrange
      const services = {
        Folder: {
          getById: stubOf('getById').resolves({
            data: 'some',
          }),
          getFolders: stubOf('getById').resolves([{}, {}]),
        },
        Files: {
          getByFolderAndUserId: stubOf('getByFolderAndUserId').resolves([{}]),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          id: 'id1',
        },
        params: {
          id: '2',
        },
        query: {
          trash: 'true',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.getFolderContents(request, response);

      // Assert
      expect(services.Folder.getFolders.calledWith('2', 'id1', true)).to.equal(true);
      expect(services.Files.getByFolderAndUserId.calledWith('2', 'id1', true)).to.equal(true);
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          data: 'some',
          children: [{}, {}],
          files: [{}],
        },
      ]);
    });
  });

  describe('Get folder size', () => {
    it('should fail if missing param `id`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        params: {
          id: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.getFolderSize(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID is not valid');
      }
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Share: {
          getFolderSize: stubOf('getFolderSize').resolves(5),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          id: '',
        },
        params: {
          id: '2',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.getFolderSize(request, response);

      // Assert
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          size: 5,
        },
      ]);
    });
  });

  describe('Move file', () => {
    it('should fail if missing param `fileId`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        body: {
          fileId: '',
          destination: '2',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.moveFile(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('File ID is not valid');
      }
    });

    it('should fail if missing param `destination`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        body: {
          fileId: '2',
          destination: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.moveFile(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Destination folder ID is not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Files: {
          MoveFile: stubOf('MoveFile').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        body: {
          fileId: '1',
          destination: '2',
        },
        headers: {},
      });
      const sendStatusSpy = sinon.spy();
      const response = getResponse({
        sendStatus: sendStatusSpy,
      });

      // Act
      await controller.moveFile(request, response);

      // Assert
      expect(services.Files.MoveFile.calledOnce).to.be.true;
      expect(sendStatusSpy.calledOnce).to.be.true;
      expect(sendStatusSpy.calledWithExactly(500)).to.be.true;
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Files: {
          MoveFile: stubOf('MoveFile').resolves({
            result: {
              some: 'data',
            },
            other: {
              some: 'more',
            },
          }),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        },
        Notifications: {
          fileUpdated: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        body: {
          fileId: '1',
          destination: '2',
        },
        headers: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.moveFile(request, response);

      // Assert
      expect(services.Files.MoveFile.calledOnce).to.be.true;
      expect(services.User.findWorkspaceMembers.calledOnce).to.be.true;
      expect(services.Notifications.fileUpdated.calledTwice).to.be.true;
      expect(services.Apn.sendStorageNotification.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          result: {
            some: 'data',
          },
          other: {
            some: 'more',
          },
        },
      ]);
    });
  });

  describe('Update file', () => {
    it('should fail if missing param `fileId`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          fileid: '',
        },
        body: {
          metadata: {},
        },
        headers: {},
      });
      const response = getResponse();

      try {
        // Act
        await controller.updateFile(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('File ID is not valid');
      }
    });

    it('should fail if missing param `bucketId`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          fileid: '1',
        },
        body: {
          metadata: {},
          bucketId: '',
          relativePath: 'sss',
        },
        headers: {},
      });
      const response = getResponse();

      try {
        // Act
        await controller.updateFile(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Bucket ID is not valid');
      }
    });

    it('should fail if missing param `relativePath`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          fileid: '1',
        },
        body: {
          metadata: {},
          bucketId: 'ss',
          relativePath: '',
        },
        headers: {},
      });
      const response = getResponse();

      try {
        // Act
        await controller.updateFile(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Relative path is not valid');
      }
    });

    it('should fail if missing mnemonic header', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          fileid: '1',
        },
        body: {
          metadata: {},
          bucketId: 'ss',
          relativePath: 'sss',
        },
        headers: {},
      });
      const response = getResponse();

      try {
        // Act
        await controller.updateFile(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Mnemonic is not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Files: {
          UpdateMetadata: stubOf('UpdateMetadata').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          fileid: '1',
        },
        body: {
          metadata: {},
          bucketId: 'ss',
          relativePath: 'sss',
        },
        headers: {
          'internxt-mnemonic': 'nemo',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.updateFile(request, response);

      // Assert
      expect(services.Files.UpdateMetadata.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal(['my-error']);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Files: {
          UpdateMetadata: stubOf('UpdateMetadata').resolves({
            data: 'some',
          }),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        },
        Notifications: {
          fileUpdated: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          bridgeUser: '',
        },
        params: {
          fileid: '1',
        },
        body: {
          metadata: {},
          bucketId: 'ss',
          relativePath: 'sss',
        },
        headers: {
          'internxt-mnemonic': 'nemo',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.updateFile(request, response);

      // Assert
      expect(services.Files.UpdateMetadata.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          data: 'some',
        },
      ]);
    });
  });

  describe('Delete file (bridge)', () => {
    it('should fail if missing param `bucketid`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          bucketid: 'null',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.deleteFileBridge(request, response);

      // Assert
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          error: 'No bucket ID provided',
        },
      ]);
    });

    it('should fail if missing param `fileid`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          bucketid: 'lala',
          fileid: 'null',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.deleteFileBridge(request, response);

      // Assert
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          error: 'No file ID provided',
        },
      ]);
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Files: {
          Delete: stubOf('Delete').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          bucketid: 'lala',
          fileid: 'lolo',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.deleteFileBridge(request, response);

      // Assert
      expect(services.Files.Delete.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          error: 'my-error',
        },
      ]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Files: {
          Delete: stubOf('Delete').resolves({
            data: 'some',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          bridgeUser: '',
        },
        params: {
          bucketid: 'lala',
          fileid: 'lolo',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.deleteFileBridge(request, response);

      // Assert
      expect(services.Files.Delete.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          deleted: true,
        },
      ]);
    });
  });

  describe('Delete file (database)', () => {
    it('should fail if missing param `fileid`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          fileid: '',
          folderid: '2',
        },
        headers: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      try {
        // Act
        await controller.deleteFileDatabase(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('File ID is not valid');
      }
    });

    it('should fail if missing param `folderid`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        params: {
          fileid: '2',
          folderid: '',
        },
        headers: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      try {
        // Act
        await controller.deleteFileDatabase(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID is not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Files: {
          DeleteFile: stubOf('DeleteFile').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          fileid: '2',
          folderid: '2',
        },
        headers: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.deleteFileDatabase(request, response);

      // Assert
      expect(services.Files.DeleteFile.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          error: 'my-error',
        },
      ]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Files: {
          DeleteFile: stubOf('DeleteFile').resolves({
            data: 'some',
          }),
        },
        User: {
          findWorkspaceMembers: stubOf('findWorkspaceMembers').resolves([{}, {}]),
          getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        },
        Notifications: {
          fileDeleted: sinon.spy(),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
        },
        Analytics: {
          trackFileDeleted: sinon.spy(),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        params: {
          fileid: '2',
          folderid: '2',
        },
        headers: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.deleteFileDatabase(request, response);

      // Assert
      expect(services.Files.DeleteFile.calledOnce).to.be.true;
      expect(services.Analytics.trackFileDeleted.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          deleted: true,
        },
      ]);
    });
  });

  describe('Get recent files', () => {
    // it('should fail if missing param `limit`', async () => {
    //   // Arrange
    //   const controller = getController({});
    //   const request = getRequest({
    //     behalfUser: {},
    //     query: {
    //       limit: '',
    //     },
    //   });
    //   const jsonSpy = sinon.spy();
    //   const response = getResponse({
    //     status: () => {
    //       return {
    //         json: jsonSpy
    //       };
    //     }
    //   });

    //   try {
    //     // Act
    //     await controller.getRecentFiles(request, response);
    //     expect(true).to.be.false;
    //   } catch ({ message }) {
    //     // Assert
    //     expect(message).to.equal('Missing limit param');
    //   }
    // });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Files: {
          getRecentFiles: stubOf('getRecentFiles').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        user: {
          email: '',
        },
        query: {
          limit: '2',
        },
      });
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy,
          };
        },
      });

      // Act
      await controller.getRecentFiles(request, response);

      // Assert
      expect(services.Files.getRecentFiles.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([
        {
          error: 'Can not get recent files',
        },
      ]);
    });

    it('should fail when no files found', async () => {
      // Arrange
      const services = {
        Files: {
          getRecentFiles: stubOf('getRecentFiles').resolves(),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        user: {
          email: '',
        },
        query: {
          limit: '3',
        },
      });
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy,
          };
        },
      });

      // Act
      await controller.getRecentFiles(request, response);

      // Assert
      expect(services.Files.getRecentFiles.calledOnce).to.be.true;
      expect(sendSpy.calledOnce).to.be.true;
      expect(sendSpy.args[0]).to.deep.equal([
        {
          error: 'Files not found',
        },
      ]);
    });

    it('should excute correct when everything is fine', async () => {
      // Arrange
      const services = {
        Files: {
          getRecentFiles: stubOf('getRecentFiles').resolves([
            {
              name: '1',
              folderId: '2',
            },
            {
              name: '3',
              folderId: '4',
            },
          ]),
        },
        Crypt: {
          decryptName: stubOf('decryptName').returns('lala'),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        user: {
          email: '',
        },
        query: {
          limit: '3',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.getRecentFiles(request, response);

      // Assert
      expect(services.Files.getRecentFiles.calledOnce).to.be.true;
      expect(services.Crypt.decryptName.calledTwice).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        [
          {
            name: 'lala',
            folderId: '2',
          },
          {
            name: 'lala',
            folderId: '4',
          },
        ],
      ]);
    });
  });

  describe('Acquire folder lock', () => {
    it('should fail if missing param `folderId`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        user: {
          id: '',
        },
        params: {
          folderId: '',
          lockId: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.acquireFolderLock(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID is not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          acquireLock: stubOf('acquireLock').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          id: '',
        },
        params: {
          folderId: '2',
          lockId: '3',
        },
      });
      const endSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            end: endSpy,
          };
        },
      });

      // Act
      await controller.acquireFolderLock(request, response);

      // Assert
      expect(services.Folder.acquireLock.calledOnce).to.be.true;
      expect(endSpy.calledOnce).to.be.true;
    });

    it('should execute correct when everything is fine', async () => {
      // Arrange
      const services = {
        Folder: {
          acquireLock: stubOf('acquireLock').resolves(),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          id: '',
        },
        params: {
          folderId: '2',
          lockId: '2',
        },
      });
      const endSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            end: endSpy,
          };
        },
      });

      // Act
      await controller.acquireFolderLock(request, response);

      // Assert
      expect(services.Folder.acquireLock.calledOnce).to.be.true;
      expect(endSpy.calledOnce).to.be.true;
    });
  });

  describe('Refresh folder lock', () => {
    it('should fail if missing param `folderId`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        user: {
          id: '',
        },
        params: {
          folderId: '',
          lockId: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.refreshFolderLock(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID is not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          refreshLock: stubOf('refreshLock').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          id: '',
        },
        params: {
          folderId: '2',
          lockId: '3',
        },
      });
      const endSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            end: endSpy,
          };
        },
      });

      // Act
      await controller.refreshFolderLock(request, response);

      // Assert
      expect(services.Folder.refreshLock.calledOnce).to.be.true;
      expect(endSpy.calledOnce).to.be.true;
    });

    it('should execute correct when everything is fine', async () => {
      // Arrange
      const services = {
        Folder: {
          refreshLock: stubOf('refreshLock').resolves(),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          id: '',
        },
        params: {
          folderId: '2',
          lockId: '2',
        },
      });
      const endSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            end: endSpy,
          };
        },
      });

      // Act
      await controller.refreshFolderLock(request, response);

      // Assert
      expect(services.Folder.refreshLock.calledOnce).to.be.true;
      expect(endSpy.calledOnce).to.be.true;
    });
  });

  describe('Release folder lock', () => {
    it('should fail if missing param `folderId`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        user: {
          id: '',
        },
        params: {
          folderId: '',
          lockId: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.releaseFolderLock(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Folder ID is not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          releaseLock: stubOf('releaseLock').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          id: '',
        },
        params: {
          folderId: '2',
          lockId: '3',
        },
      });
      const endSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            end: endSpy,
          };
        },
      });

      // Act
      await controller.releaseFolderLock(request, response);

      // Assert
      expect(services.Folder.releaseLock.calledOnce).to.be.true;
      expect(endSpy.calledOnce).to.be.true;
    });

    it('should execute correct when everything is fine', async () => {
      // Arrange
      const services = {
        Folder: {
          releaseLock: stubOf('releaseLock').resolves(),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {
          id: '',
        },
        params: {
          folderId: '2',
          lockId: '2',
        },
      });
      const endSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            end: endSpy,
          };
        },
      });

      // Act
      await controller.releaseFolderLock(request, response);

      // Assert
      expect(services.Folder.releaseLock.calledOnce).to.be.true;
      expect(endSpy.calledOnce).to.be.true;
    });
  });

  describe('Rename file in network', () => {
    it('should fail if missing param `fileId`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        body: {
          fileId: '',
          bucketId: '1',
          relativePath: '2',
        },
        headers: {
          'internxt-mnemonic': '4',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.renameFileInNetwork(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('File ID is not valid');
      }
    });

    it('should fail if missing param `bucketId`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        body: {
          fileId: '3',
          bucketId: '',
          relativePath: '2',
        },
        headers: {
          'internxt-mnemonic': '4',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.renameFileInNetwork(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Bucket ID is not valid');
      }
    });

    it('should fail if missing param `relativePath`', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        body: {
          fileId: '4',
          bucketId: '1',
          relativePath: '',
        },
        headers: {
          'internxt-mnemonic': '4',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.renameFileInNetwork(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Relative path is not valid');
      }
    });

    it('should fail if missing mnemonic header', async () => {
      // Arrange
      const controller = getController({});
      const request = getRequest({
        behalfUser: {},
        body: {
          fileId: '2',
          bucketId: '1',
          relativePath: '2',
        },
        headers: {
          'internxt-mnemonic': '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.renameFileInNetwork(request, response);
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Mnemonic is not valid');
      }
    });

    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Inxt: {
          renameFile: stubOf('renameFile').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {},
        body: {
          fileId: '2',
          bucketId: '1',
          relativePath: '2',
        },
        headers: {
          'internxt-mnemonic': 'wever',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.renameFileInNetwork(request, response);

      // Assert
      expect(services.Inxt.renameFile.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          error: 'my-error',
        },
      ]);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Inxt: {
          renameFile: stubOf('renameFile').resolves({
            data: 'some',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        behalfUser: {
          email: '',
          userId: '',
        },
        body: {
          fileId: '2',
          bucketId: '1',
          relativePath: '2',
        },
        headers: {
          'internxt-mnemonic': 'wever',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.renameFileInNetwork(request, response);

      // Assert
      expect(services.Inxt.renameFile.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          message: 'File renamed in network: 2',
        },
      ]);
    });
  });

  describe('Fix duplicated folder', () => {
    it('should return error when execution fails', async () => {
      // Arrange
      const services = {
        Folder: {
          changeDuplicateName: stubOf('changeDuplicateName').rejects({
            message: 'my-error',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.fixDuplicate(request, response);

      // Assert
      expect(services.Folder.changeDuplicateName.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal(['my-error']);
    });

    it('should execute fine when no error', async () => {
      // Arrange
      const services = {
        Folder: {
          changeDuplicateName: stubOf('changeDuplicateName').resolves({
            data: 'some',
          }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        user: {},
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.fixDuplicate(request, response);

      // Assert
      expect(services.Folder.changeDuplicateName.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
      expect(jsonSpy.args[0]).to.deep.equal([
        {
          data: 'some',
        },
      ]);
    });
  });
  describe('getTokensAndSendNotification', () => {
    it('When no tokens are found apn should not be called', async () => {
      const services = {
        User: {
          getUserNotificationTokens: sinon.stub().resolves([]),
        },
        Apn: {
          sendStorageNotification: sinon.stub(),
        },
      };

      const controller = getController(services);

      await controller.getTokensAndSendNotification('userId');

      expect(services.User.getUserNotificationTokens.calledOnce).to.be.true;
      expect(services.Apn.sendStorageNotification.called).to.be.false;
    });

    it('When APN returns 410 the token should be deleted', async () => {
      const services = {
        User: {
          getUserNotificationTokens: sinon.stub().resolves(['token']),
          deleteUserNotificationTokens: sinon.stub().resolves(1),
        },
        Apn: {
          sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 410, body: 'Expired token' })),
        },
      };

      const controller = getController(services);

      await controller.getTokensAndSendNotification('userId');

      expect(services.User.getUserNotificationTokens.calledOnce).to.be.true;
      expect(services.Apn.sendStorageNotification.calledOnce).to.be.true;
      expect(services.User.deleteUserNotificationTokens.calledOnce).to.be.true;
    });
  });

  it('When APN returns 200 the token should not be deleted', async () => {
    const services = {
      User: {
        getUserNotificationTokens: sinon.stub().resolves([{ token: 'token' }]),
        deleteUserNotificationTokens: sinon.spy(),
      },
      Apn: {
        sendStorageNotification: sinon.stub().resolves(Promise.resolve({ statusCode: 200, body: 'ok' })),
      },
    };

    const controller = getController(services);

    await controller.getTokensAndSendNotification('userId');

    expect(services.User.getUserNotificationTokens.calledOnce).to.be.true;
    expect(services.Apn.sendStorageNotification.calledOnce).to.be.true;
    expect(services.User.deleteUserNotificationTokens.called).to.be.false;
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
    Share: {},
    Crypt: {},
    Inxt: {},
  };

  const finalServices = {
    ...defaultServices,
    ...services,
  };

  const defaultLogger = {
    error: () => null,
    warn: () => null,
  };

  const finalLogger = {
    ...defaultLogger,
    ...logger,
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
  return sinon.stub(
    {
      [functionName]: null,
    },
    functionName,
  );
}
