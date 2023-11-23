import { HttpStatusCode } from "axios";
import { BaseError } from "./baseError";

export class APIError extends BaseError {
  constructor(
    name: string,
    public httpCode = HttpStatusCode.InternalServerError,
    description = "internal server error"
  ) {
    super(name, description);
  }
}
