import bcrypt from 'bcrypt';

const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, rounds);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}
