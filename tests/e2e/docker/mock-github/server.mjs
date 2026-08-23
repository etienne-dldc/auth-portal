import { createServer } from "node:http";

const DEFAULT_CONFIG = {
  user: { login: "testuser" },
  emails: [{ email: "test@example.com", primary: true, verified: true }],
  accessToken: "mock-access-token",
  tokenStatus: 200,
  userStatus: 200,
  emailsStatus: 200,
};

let config = { ...DEFAULT_CONFIG };

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // Config API — used by Playwright to dynamically update responses
  if (req.method === "POST" && url.pathname === "/__config") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      config = { ...DEFAULT_CONFIG, ...JSON.parse(body) };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/__reset") {
    config = { ...DEFAULT_CONFIG };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // GitHub OAuth endpoints
  if (req.method === "POST" && url.pathname === "/login/oauth/access_token") {
    res.writeHead(config.tokenStatus ?? 200, {
      "Content-Type": "application/json",
    });
    if ((config.tokenStatus ?? 200) !== 200) {
      res.end(JSON.stringify({ error: "bad_verification_code" }));
      return;
    }
    res.end(JSON.stringify({
      access_token: config.accessToken ?? "mock-access-token",
      token_type: "bearer",
      scope: "user:email",
    }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/user") {
    res.writeHead(config.userStatus ?? 200, {
      "Content-Type": "application/json",
    });
    if ((config.userStatus ?? 200) !== 200) {
      res.end(JSON.stringify({ message: "Not Found" }));
      return;
    }
    res.end(JSON.stringify(config.user ?? { login: "testuser" }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/user/emails") {
    res.writeHead(config.emailsStatus ?? 200, {
      "Content-Type": "application/json",
    });
    if ((config.emailsStatus ?? 200) !== 200) {
      res.end(JSON.stringify({ message: "Not Found" }));
      return;
    }
    res.end(JSON.stringify(
      config.emails ?? [{
        email: "test@example.com",
        primary: true,
        verified: true,
      }],
    ));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

const PORT = parseInt(process.env.MOCK_GITHUB_PORT ?? "9876", 10);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Mock GitHub server listening on :${PORT}`);
});
