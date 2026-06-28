import { Link, Paper, Typography } from "@dldc/hono-ui";
import { Layout } from "../components/Layout.tsx";

interface RedirectPageProps {
  redirectUrl: string;
}

export const RedirectPage = ({ redirectUrl }: RedirectPageProps) => {
  return (
    <Layout title="Redirecting...">
      <Paper
        gap={4}
        flexDirection="column"
        padding={4}
      >
        <Typography render="h5">
          Redirecting to the application...
        </Typography>
        <Typography>
          If you are not redirected automatically, click{" "}
          <Link href={redirectUrl}>
            here
          </Link>
          .
        </Typography>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.href = "${redirectUrl}";`,
          }}
        />
      </Paper>
    </Layout>
  );
};
