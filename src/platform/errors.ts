export const createAppError = (status: number, message: string, code: string): Error & { status: number; code: string } => {
  const error = new Error(message) as Error & { status: number; code: string };
  error.status = status;
  error.code = code;
  return error;
};
