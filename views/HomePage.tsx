import {
  ButtonLink,
  css,
  cxClassList,
  Icon,
  Link,
  Paper,
  Stack,
  Typography,
} from "@dldc/hono-ui";
import { LogOut } from "lucide-static";
import { Layout } from "../components/Layout.tsx";
import { ROUTES } from "../logic/routes.ts";
import { System } from "../logic/system.ts";

interface HomePageProps {
  username: string;
}

const linkClassName = css({
  outline: "none",
  position: "relative",
  cursor: "pointer",
  cornerShape: "superellipse",
  background: "white/5",
  color: "neutral-200",
  borderRadius: 4,
  paddingBlock: 2,
  paddingInline: 4,
  display: "flex",
  flexDirection: "column",
  gap: 0,
  selectors: {
    "&::after": {
      // Used for focus and highlight border
      borderRadius: "inherit",
      content: "empty",
      cornerShape: "inherit",
      pointerEvents: "none",
      position: "absolute",
      inset: 0,
    },
    "&::before": {
      // Used for visual border for input and surface variants
      borderRadius: "inherit",
      cornerShape: "inherit",
      pointerEvents: "none",
      content: "empty",
      position: "absolute",
      inset: 0,
      borderWidth: "0.5px",
      borderStyle: "solid",
      borderColor: "white/10",
    },
    "&:hover": {
      background: "white/10",
      color: "neutral-100",
    },
  },
});

export const HomePage = ({ username }: HomePageProps) => {
  const apps = System.get().getAppsForUser(username);

  return (
    <Layout title="Apps">
      <Paper
        gap={4}
        flexDirection="column"
        padding={4}
      >
        <Typography fontSize="3xl" render="h1">Welcome, {username}</Typography>
        <Stack gap={3} flexDirection="column">
          {apps.map((app) => {
            const url = new URL(app.origin);
            const title = app.name ?? url.hostname;

            return (
              <a
                key={app.origin}
                href={app.origin}
                class={cxClassList(linkClassName)}
              >
                <Typography render="h2">{title}</Typography>
                <Typography
                  fontSize="[0.8em]"
                  classList={[css({ opacity: 0.6 })]}
                >
                  {app.origin}
                </Typography>
              </a>
            );
          })}
        </Stack>
        <Link href={ROUTES.basicAuthHelper.link({})}>
          Basic Auth Helper
        </Link>
      </Paper>
      <Stack>
        <ButtonLink variant="danger" href={ROUTES.logout.link({})}>
          <Icon icon={LogOut} />
          Logout
        </ButtonLink>
      </Stack>
    </Layout>
  );
};
