export class InvalidFolderDataError extends Error {
  __proto__: InvalidFolderDataError;

  constructor(message: string) {
    const trueProto = new.target.prototype;
    super(message);
    this.__proto__ = trueProto;
  }
}

export class FolderCannotBeCreatedError extends Error {
  __proto__: FolderCannotBeCreatedError;

  constructor(message: string) {
    const trueProto = new.target.prototype;
    super(message);
    this.__proto__ = trueProto;
  }
}