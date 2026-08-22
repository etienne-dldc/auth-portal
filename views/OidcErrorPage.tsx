import { ButtonLink, css, Icon, Paper } from "@dldc/hono-ui";
import type { FC } from "@hono/hono/jsx";
import { ArrowLeft } from "lucide-static";
import { Layout } from "../components/Layout.tsx";

export type OidcError =
  | "invalid_request"
  | "invalid_client"
  | "invalid_redirect_uri"
  | "unsupported_response_type"
  | "invalid_scope"
  | "access_denied";

type OidcErrorPageProps = {
  error: OidcError;
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

const errorMessages: Record<OidcError, { title: string; message: string }> = {
  invalid_request: {
    title: "Invalid Request",
    message:
      "The authorization request is missing required parameters or is malformed.",
  },
  invalid_client: {
    title: "Unknown Client",
    message:
      "The client ID provided does not correspond to a registered OIDC client.",
  },
  invalid_redirect_uri: {
    title: "Invalid Redirect URI",
    message:
      "The redirect URI does not match any registered redirect URI for this client.",
  },
  unsupported_response_type: {
    title: "Unsupported Response Type",
    message: "Only the 'code' response type is supported.",
  },
  invalid_scope: {
    title: "Invalid Scope",
    message: "The 'openid' scope is required.",
  },
  access_denied: {
    title: "Access Denied",
    message: "You are not authorized to use this application.",
  },
};

export const OidcErrorPage: FC<OidcErrorPageProps> = ({
  error,
  returnPath = "/",
  returnLabel = "Back",
}) => {
  const { title, message } = errorMessages[error];
  return (
    <Layout title={title}>
      <ButtonLink href={returnPath} variant="ghost">
        <Icon icon={ArrowLeft} /> {returnLabel}
      </ButtonLink>
      <Paper classList={containerClass}>
        <div class={headerClass}>
          <h2 class={titleClass}>{title}</h2>
        </div>
        <p class={messageClass}>{message}</p>
      </Paper>
    </Layout>
  );
};
