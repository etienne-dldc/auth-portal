import { Paper } from "@dldc/hono-ui";
import { Layout } from "../components/Layout.tsx";

export const HomePage = () => {
  return (
    <Layout title="Apps">
      <Paper
        gap={4}
        flexDirection="column"
        padding={4}
      >
        <p>TODO</p>
      </Paper>
    </Layout>
  );
};
