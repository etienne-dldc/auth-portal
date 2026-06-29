import { hash } from "@felix/argon2";
import { BasicAuthHelperPage } from "../../views/BasicAuthHelperPage.tsx";
import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";

export const basicAuthHelper = createPathHandler(
  ROUTES.basicAuthHelper.path,
)(
  async (c) => {
    const session = c.get("session");
    if (!session) {
      return c.redirect(ROUTES.login.link({}));
    }

    const token = c.req.query("token");
    if (token) {
      const argon2Hash = await hash(token);
      const basicAuth = `Basic ${btoa(`${session.username}:${token}`)}`;

      return c.render(
        <BasicAuthHelperPage
          argon2Hash={argon2Hash}
          basicAuth={basicAuth}
          token={token}
        />,
      );
    }

    return c.render(<BasicAuthHelperPage />);
  },
);
