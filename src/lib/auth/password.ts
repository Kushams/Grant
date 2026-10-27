import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// A valid hash of a random value; compared against when the email is unknown so that
// response time does not reveal whether an account exists.
export const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7jY5y5pZ1Wc1m9m0m6VQ8T8Qm6P1Ncy";
