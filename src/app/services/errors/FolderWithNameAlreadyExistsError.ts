export class FolderWithNameAlreadyExistsError extends Error {
  static message = 'Folder with this name exists';

  constructor() {
    super(FolderWithNameAlreadyExistsError.message);
  }
}
