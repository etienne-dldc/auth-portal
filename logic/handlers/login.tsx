import { LoginPage } from "../../views/LoginPage.tsx";
import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";

export const login = createPathHandler(ROUTES.login.path)(
  // deno-lint-ignore require-await
  async (c) => {
    const session = c.get("session");
    if (session) {
      return c.redirect(ROUTES.home.path);
    }
    return c.html(<LoginPage />);
  },
);
