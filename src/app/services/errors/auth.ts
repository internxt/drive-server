export class UserHasNoOwnershipError extends Error {
  constructor(message: string) {
    super(message);
  }
}