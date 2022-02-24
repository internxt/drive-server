export default class Validator {
  public static isValidString(string: unknown): boolean {
    return typeof string === 'string' && string.length > 0;
  }

  public static isInvalidString(string: unknown): boolean {
    return !Validator.isValidString(string);
  }

  public static isInvalidPositiveNumber(number: unknown): boolean {
    return isNaN(Number(number)) || Number(number) <= 0;
  }
}