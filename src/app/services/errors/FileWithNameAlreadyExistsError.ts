export class FileWithNameAlreadyExistsError extends Error {
  static message = 'File with this name exists';
  constructor() {
    super(FileWithNameAlreadyExistsError.message);
  }
}
