/**
 * Random id safe to use in HTML id attributes, with a customizable size (default: 10 characters).
 * Using modern crypto API to generate random values, ensuring uniqueness and security.
 */
export function randomId(size: number = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const charsLength = chars.length;
  const randomValues = new Uint32Array(size);
  crypto.getRandomValues(randomValues);

  let result = "";
  for (let i = 0; i < size; i++) {
    result += chars[randomValues[i] % charsLength];
  }
  return result;
}
