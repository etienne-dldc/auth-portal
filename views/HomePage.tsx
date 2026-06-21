import { Paper } from "@dldc/hono-ui";
import { Layout } from "../components/Layout.tsx";
import type { Flash } from "../logic/flash.ts";

type AppsPageProps = {
  flash?: Flash;
};

export const HomePage = ({ flash }: AppsPageProps) => {
  return (
    <Layout title="Apps" flash={flash}>
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
