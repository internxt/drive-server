export interface Location {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

interface App {
  name?: string;
  version?: string;
}

interface Campaign {
  name?: string;
  source?: string;
  medium?: string;
  term?: string;
  content?: string;
}

export interface Context {
  app: App;
  campaign?: Campaign;
  ip: string;
  location?: Location;
  userAgent: string;
  locale: string;
}

export interface User {
  uuid: string;
  appsumoDetails: boolean;
  sharedWorkspace: boolean;
  name: string;
  lastname: string;
}

export interface ReqUser {
  user: { uuid: string };
}

export enum TrackName {
  DeactivationRequest = 'Deactivation Requested',
  SignUp = 'User Signup',
  InvitationSent = 'Invitation Sent',
  DeactivationConfirmed = 'Deactivation Confirmed',
  ReferralRedeemed = 'Referral Redeemed',
  InvitationAccepted = 'Invitation Accepted',
  UploadCompleted = 'Upload Completed',
  ShareLinkCopied = 'Share Link Copied',
  FileDeleted = 'File Deleted',
  SharedLinkItemDownloaded = 'Shared Link Downloaded',
  DownloadCompleted = 'Download Completed',
}
