export class LockNotAvaliableError extends Error {
  constructor(folderId: number) {
    super(`Lock for ${folderId} is not avaliable`);
  }
}
