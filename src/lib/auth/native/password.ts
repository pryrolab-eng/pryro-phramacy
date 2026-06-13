import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  encryptedPassword: string | null | undefined,
): Promise<boolean> {
  if (!encryptedPassword) return false;
  return bcrypt.compare(password, encryptedPassword);
}
