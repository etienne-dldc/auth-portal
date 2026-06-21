import { css, Html, Title, UniversalLayout } from "@dldc/hono-ui";
import { type Child, Fragment } from "hono/jsx";
import type { Flash } from "../logic/flash.ts";

type LayoutProps = {
  title?: string;
  children: Child;
  flash?: Flash;
};

const successClass = css({
  background: "green-800/10",
  borderLeft: "[3px solid]",
  color: "green-300",
  borderRadius: 1,
  cornerShape: "superellipse",
  padding: "[10px 14px]",
  fontSize: "sm",
});

const errorClass = css({
  background: "red-800/10",
  borderLeft: "[3px solid]",
  color: "red-300",
  borderRadius: 1,
  cornerShape: "superellipse",
  padding: "[10px 14px]",
  fontSize: "sm",
});

export function Layout({ title, children, flash }: LayoutProps) {
  const flashClass = flash?.type === "success" ? successClass : errorClass;

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
            src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta2/dist/htmx.esm.min.js"
            integrity="sha384-imtDMsKpIb5KDnuaceZPNUtGHemw6nZSQTAcVNpfegk47oSVnMbe0dp6civ/SA4s"
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
        {flash ? <div class={flashClass}>{flash.message}</div> : null}
        {children}
      </UniversalLayout>
    </Html>
  );
}
