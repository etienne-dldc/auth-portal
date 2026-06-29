import { ButtonLink, css, Icon, Paper } from "@dldc/hono-ui";
import type { FC } from "@hono/hono/jsx";
import { ArrowLeft } from "lucide-static";
import { Layout } from "../components/Layout.tsx";

type ErrorPageProps = {
  title?: string;
  message: string;
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

export const ErrorPage: FC<ErrorPageProps> = ({
  title = "Error",
  message,
  returnPath = "/",
  returnLabel = "Back",
}) => {
  return (
    <Layout>
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
