export class FolderWithNameAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, FolderWithNameAlreadyExistsError.prototype);
  }
}

export class FolderAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, FolderAlreadyExistsError.prototype);
  }
}
