export class BaseError extends Error {
  constructor(
    public readonly name: string,
    public readonly description: string
  ) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.description = description;

    Error.captureStackTrace(this);
  }
}
