import { css, Link, Paper } from "@dldc/hono-ui";
import { Layout } from "../components/Layout.tsx";

export type LoginSessionError =
  | "SessionExpired"
  | "OAuthError"
  | "SessionRemoved"
  | "IdentitiesDidNotMatch"
  | "UnexpectedOAuthError";

type OAuthErrorPageProps = {
  errorKey: LoginSessionError;
  returnPath?: string;
  returnLabel?: string;
};

const containerClass = css({
  display: "flex",
  flexDirection: "column",
  gap: 3,
  padding: 2,
});

const headerClass = css({
  display: "flex",
  flexDirection: "column",
  gap: 1,
});

const titleClass = css({
  fontSize: "2xl",
  fontWeight: "bold",
  color: "red-400",
  margin: 0,
});

const messageClass = css({
  fontSize: "lg",
  color: "gray-200",
  margin: 0,
  lineHeight: 1.5,
});

const linkClass = css({
  color: "blue-400",
  textDecoration: "none",
  transition: "opacity 140ms ease",
  selectors: {
    "&:hover": {
      opacity: 0.8,
    },
  },
});

export function OAuthErrorPage(
  { errorKey, returnPath = "/", returnLabel = "Back" }: OAuthErrorPageProps,
) {
  return (
    <Layout>
      <Link href={returnPath}>
        <span class={linkClass}>← {returnLabel}</span>
      </Link>
      <Paper classList={containerClass}>
        <div class={headerClass}>
          <h2 class={titleClass}>{errorKey}</h2>
        </div>
        <p class={messageClass}>{errorKey}</p>
      </Paper>
    </Layout>
  );
}
