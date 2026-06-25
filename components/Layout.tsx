import { css, Html, Title, UniversalLayout } from "@dldc/hono-ui";
import { type Child, Fragment } from "@hono/hono/jsx";

type LayoutProps = {
  title?: string;
  children: Child;
};

export function Layout({ title, children }: LayoutProps) {
  return (
    <Html
      title={title ? `${title} - Auth Portal` : "Auth Portal"}
      heads={
        <Fragment>
          <link
            rel="icon"
            href={`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔒</text></svg>`}
          />
          <script
            type="module"
            src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4/dist/htmx.esm.min.js"
            integrity="sha384-md54RSbheZ0Mpr9oo11vo7Cvrz9acwqg8tSLEoFeo1R6FsZmD3jFVKokISxCeT6Q"
            crossorigin="anonymous"
          >
          </script>
        </Fragment>
      }
    >
      <UniversalLayout classList={css({ rowGap: "[16px]" })}>
        <Title>
          Auth Portal
        </Title>
        {children}
      </UniversalLayout>
    </Html>
  );
}
