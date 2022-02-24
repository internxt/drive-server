import { Request, Response } from 'express';
import { Logger } from 'winston';
import sinon, { SinonStub } from 'sinon';
import { expect } from 'chai';
import { ShareController } from '../../src/app/routes/share';

describe('Share controller', () => {

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
        expect(true).to.be.false;
        expect(true).to.be.false;
      } catch ({ message }) {
        // Assert
        expect(message).to.equal(error);
      }
    }

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