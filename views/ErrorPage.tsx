import { css, Link, Paper } from "@dldc/hono-ui";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";

type ErrorPageProps = {
  title?: string;
  message: string;
  returnPath?: string;
  returnLabel?: string;
};

export const ErrorPage: FC<ErrorPageProps> = ({
  title = "Error",
  message,
  returnPath = "/",
  returnLabel = "Back",
}) => {
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

  return (
    <Layout>
      <Link href={returnPath}>
        <span class={linkClass}>← {returnLabel}</span>
      </Link>
      <Paper classList={containerClass}>
        <div class={headerClass}>
          <h2 class={titleClass}>{title}</h2>
        </div>
        <p class={messageClass}>{message}</p>
      </Paper>
    </Layout>
  );
};
