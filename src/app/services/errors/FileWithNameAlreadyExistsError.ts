export class FileWithNameAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, FileWithNameAlreadyExistsError.prototype);
  }
}

export class FileAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, FileAlreadyExistsError.prototype);
  }
}
