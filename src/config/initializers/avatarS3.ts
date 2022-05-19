import AWS from 'aws-sdk';

export default class AvatarS3 {
  private static instance: AWS.S3;

  static getInstance(): AWS.S3 {
    if (AvatarS3.instance) {
      return AvatarS3.instance;
    }

    AvatarS3.instance = new AWS.S3({
      endpoint: process.env.AVATAR_ENDPOINT,
      region: process.env.AVATAR_REGION,
      credentials: {
        accessKeyId: process.env.AVATAR_ACCESS_KEY as string,
        secretAccessKey: process.env.AVATAR_SECRET_KEY as string,
      },
    });

    return AvatarS3.instance;
  }
}
