export class FileWithNameAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, FileWithNameAlreadyExistsError.prototype);
  }
}
