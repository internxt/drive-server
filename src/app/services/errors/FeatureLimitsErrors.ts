export class NoLimitFoundForUserTierAndLabel extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, NoLimitFoundForUserTierAndLabel.prototype);
  }
}
