/**
 * UserError - An error type for user-facing error messages.
 * Use this in actions to throw errors that can be safely displayed to users.
 * The `code` property allows UI to handle specific error cases.
 */
export class UserError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "UserError";
  }
}

/**
 * Type guard to check if an error is a UserError
 */
export function isUserError(error: unknown): error is UserError {
  return error instanceof UserError;
}
