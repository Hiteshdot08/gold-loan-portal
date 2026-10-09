import type { ZodError } from "zod";

export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  status: number;
  code: string;
  fields: FieldError[];
  extra: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields: FieldError[] = [],
    extra: Record<string, unknown> = {}
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.extra = extra;
  }
}

export function fromZod(err: ZodError): AppError {
  const fields = err.issues.map((i) => ({
    field: i.path.join("."),
    message: i.message,
  }));
  return new AppError(400, "VALIDATION_ERROR", "Invalid request", fields);
}

export function toErrorBody(err: AppError) {
  return {
    error: {
      code: err.code,
      message: err.message,
      fields: err.fields,
      ...err.extra,
    },
  };
}
