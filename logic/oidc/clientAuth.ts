import { System, type TOidcClient } from "../system.ts";

export interface ClientAuthResult {
  client: TOidcClient | null;
  error?: string;
}

export function authenticateClient(
  request: Request,
  formData: URLSearchParams,
): ClientAuthResult {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) {
      return { client: null, error: "invalid_client" };
    }
    const clientId = decoded.slice(0, colonIndex);
    const clientSecret = decoded.slice(colonIndex + 1);
    return verifyClientCredentials(clientId, clientSecret);
  }

  const clientId = formData.get("client_id");
  const clientSecret = formData.get("client_secret");
  if (clientId && clientSecret) {
    return verifyClientCredentials(clientId, clientSecret);
  }

  if (clientId) {
    return verifyPublicClient(clientId);
  }

  return { client: null, error: "invalid_client" };
}

function verifyClientCredentials(
  clientId: string,
  clientSecret: string,
): ClientAuthResult {
  const client = System.get().getOidcClient(clientId);
  if (!client) return { client: null, error: "invalid_client" };
  if (client.public) return { client: null, error: "invalid_client" };
  if (!client.clientSecret || client.clientSecret !== clientSecret) {
    return { client: null, error: "invalid_client" };
  }
  return { client };
}

function verifyPublicClient(clientId: string): ClientAuthResult {
  const client = System.get().getOidcClient(clientId);
  if (!client) return { client: null, error: "invalid_client" };
  if (!client.public) return { client: null, error: "invalid_client" };
  return { client };
}
