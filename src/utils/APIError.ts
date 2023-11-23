import { HttpStatusCode } from "axios";
import { BaseError } from "./baseError";

export class APIError extends BaseError {
  constructor(
    public name: string,
    public description = "internal server error",
    public httpCode = HttpStatusCode.InternalServerError
  ) {
    super(name, description, true);

    this.httpCode = httpCode;
  }
}
