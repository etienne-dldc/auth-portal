import { Link, Paper } from "@dldc/hono-ui";
import { Layout } from "../components/Layout.tsx";
import { ROUTES } from "../logic/routes.ts";

interface HomePageProps {
  username: string;
}

export const HomePage = ({ username }: HomePageProps) => {
  return (
    <Layout title="Apps">
      <Paper
        gap={4}
        flexDirection="column"
        padding={4}
      >
        <p>Welcome, {username}!</p>
      </Paper>
      <Link href={ROUTES.logout.path}>Logout</Link>
    </Layout>
  );
};
