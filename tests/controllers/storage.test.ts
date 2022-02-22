import { Request, Response } from 'express';
import { StorageController } from '../../src/app/routes/storage-v2';
import { Logger } from 'winston';
import sinon from 'sinon';
import { expect } from 'chai';

describe('Storage controller', () => {

  describe('Create file', () => {

    it('should fail if missing header client-id', async () => {
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
          file: {},
        },
        headers: {
          'internxt-client': ''
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

      try {

        // Act
        await controller.createFile(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Missing header internxt-client-id');
      }

    });

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
          'internxt-client-id': '11',
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
          'internxt-client-id': '11',
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
          'internxt-client-id': '11',
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
          'internxt-client-id': '11',
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
          'internxt-client-id': '11',
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
          findWorkspaceMembers: sinon.stub({
            findWorkspaceMembers: null
          }, 'findWorkspaceMembers')
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
          'internxt-client-id': '11',
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
          findWorkspaceMembers: sinon.stub({
            findWorkspaceMembers: null
          }, 'findWorkspaceMembers')
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
          'internxt-client-id': '11',
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
          applyUserReferral: sinon.stub({
            applyUserReferral: null
          }, 'applyUserReferral')
            .resolves()
        },
        User: {
          findWorkspaceMembers: sinon.stub({
            findWorkspaceMembers: null
          }, 'findWorkspaceMembers')
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
          'internxt-client-id': '11',
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
          applyUserReferral: sinon.stub({
            applyUserReferral: null
          }, 'applyUserReferral')
            .resolves()
        },
        User: {
          findWorkspaceMembers: sinon.stub({
            findWorkspaceMembers: null
          }, 'findWorkspaceMembers')
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
          'internxt-client-id': '11',
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
        headers: {
          'internxt-client-id': '--'
        }
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
        headers: {
          'internxt-client-id': '--'
        }
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

    it('should fail if missing header client-id', async () => {
      // Arrange
      const controller = getController({});
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
      const response = getResponse();

      try {
        // Act
        await controller.createFolder(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Missing header internxt-client-id');
      }
    });

    it('should return error if creation fails', async () => {
      // Arrange
      const services = {
        Folder: {
          Create: sinon.stub({
            Create: null
          }, 'Create')
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
        headers: {
          'internxt-client-id': '--'
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
          Create: sinon.stub({
            Create: null
          }, 'Create')
            .resolves({
              data: 'some'
            })
        },
        User: {
          findWorkspaceMembers: sinon.stub({
            findWorkspaceMembers: null
          }, 'findWorkspaceMembers')
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
        headers: {
          'internxt-client-id': '--'
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

});


function getController(services = {}, logger = {}): StorageController {
  const defaultServices = {
    Files: {},
    Folder: {},
    UsersReferrals: {},
    Analytics: {},
    User: {},
    Notifications: {}
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