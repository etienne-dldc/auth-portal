import { css, Link, Paper } from "@dldc/hono-ui";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";

const titleClass = css({
  fontSize: "3xl",
  fontWeight: "bold",
  color: "white",
});

export const NotFoundPage: FC = () => {
  return (
    <Layout>
      <Paper
        classList={css({
          display: "flex",
          flexDirection: "column",
          gap: 2,
          padding: 3,
        })}
      >
        <h1 class={titleClass}>404</h1>
        <p class={css({ fontSize: "xl", color: "gray-200" })}>
          Page not found.
        </p>
        <Link href="/">Go back to home</Link>
      </Paper>
    </Layout>
  );
};
