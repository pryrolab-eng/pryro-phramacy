export class PlatformPolicyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 403,
  ) {
    super(message);
    this.name = "PlatformPolicyError";
  }
}

export function platformPolicyErrorResponse(err: unknown) {
  if (err instanceof PlatformPolicyError) {
    return {
      status: err.status,
      body: { error: err.message, code: err.code },
    };
  }
  return null;
}
