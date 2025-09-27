import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10 // Thông thường từ 10 đến 12

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword)
}
