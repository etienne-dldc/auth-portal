import { ButtonLink, css, Icon, Paper } from "@dldc/hono-ui";
import type { FC } from "@hono/hono/jsx";
import { ArrowLeft } from "lucide-static";
import { Layout } from "../components/Layout.tsx";

export type SSOError =
  | "MissingRedirect"
  | "NotAllowed";

type SSOErrorPageProps = {
  error: SSOError;
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

const errorMessages: Record<SSOError, { title: string; message: string }> = {
  MissingRedirect: {
    title: "Missing Redirect",
    message:
      "No redirect URL was provided. Please try accessing your application again.",
  },
  NotAllowed: {
    title: "Access Denied",
    message:
      "You do not have access to this application, or it does not exist. If you believe this is an error, please contact your administrator.",
  },
};

export const SSOErrorPage: FC<SSOErrorPageProps> = ({
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
