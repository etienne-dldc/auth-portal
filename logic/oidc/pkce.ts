export async function verifyPkce(
  codeVerifier: string,
  codeChallenge: string,
  method: "S256" | "plain",
): Promise<boolean> {
  if (method === "plain") {
    return codeVerifier === codeChallenge;
  }
  const data = new TextEncoder().encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  const base64url = base64UrlEncode(hashArray);
  return base64url === codeChallenge;
}

function base64UrlEncode(bytes: Uint8Array): string {
  const str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
