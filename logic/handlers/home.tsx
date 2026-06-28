import { HomePage } from "../../views/HomePage.tsx";
import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";

export const home = createPathHandler(ROUTES.home.path)(
  // deno-lint-ignore require-await
  async (c) => {
    const session = c.get("session");
    if (!session) {
      return c.redirect(ROUTES.login.path);
    }
    return c.render(<HomePage username={session.username} />);
  },
);
