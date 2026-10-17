import * as argon2 from "@node-rs/argon2";

/**
 * OWASP Password Storage Guidelines (Argon2id):
 * - Type: Argon2id (resistant to GPU and side-channel attacks)
 * - Memory Cost: 65,536 KiB (64 MiB)
 * - Time Cost: 3 iterations
 * - Parallelism: 4 lanes
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    memoryCost: 65536,
    timeCost: 3,
    outputLen: 32,
    parallelism: 4,
    algorithm: 2, // Argon2id
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch (err) {
    console.error("Argon2 verification failure:", err);
    return false;
  }
}
