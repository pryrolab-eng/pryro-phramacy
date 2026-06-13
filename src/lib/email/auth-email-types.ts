export type AuthEmailResult =
  | { ok: true; provider: "nodemailer" }
  | { ok: false; error: string };
