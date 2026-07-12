export class ApiError<TPayload = unknown> extends Error {
  readonly status: number;
  readonly payload: TPayload | undefined;

  constructor(status: number, message: string, payload?: TPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}
