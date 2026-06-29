import {
  Button,
  ButtonLink,
  css,
  FormField,
  Icon,
  InlineGroup,
  Input,
  Paper,
  Stack,
  Typography,
} from "@dldc/hono-ui";
import { ArrowLeft } from "lucide-static";
import { Layout } from "../components/Layout.tsx";
import { ROUTES } from "../logic/routes.ts";

interface BasicAuthHelperPageProps {
  argon2Hash?: string;
  basicAuth?: string;
  token?: string;
}

export const BasicAuthHelperPage = (
  { argon2Hash, basicAuth, token }: BasicAuthHelperPageProps,
) => {
  return (
    <Layout title="Apps">
      <Stack>
        <ButtonLink href={ROUTES.home.link({})} variant="ghost">
          <Icon icon={ArrowLeft} /> Back
        </ButtonLink>
      </Stack>
      <Paper
        gap={4}
        flexDirection="column"
        padding={4}
        alignItems="stretch"
      >
        <Typography fontSize="3xl" render="h1">Basic Auth Helper</Typography>
        <form method="get" action={ROUTES.basicAuthHelper.link({})}>
          <InlineGroup>
            <Input
              id="token"
              name="token"
              placeholder="Enter your token"
              value={token}
            />
            <Button type="submit" variant="primary">
              Generate
            </Button>
          </InlineGroup>
        </form>

        {argon2Hash && (
          <FormField
            id="argon2Hash"
            label="Argon2 Hash"
          >
            <Input
              id="argon2Hash"
              name="argon2Hash"
              placeholder="Enter your Argon2 hash"
              aria-describedby="argon2Hash-hint"
              value={argon2Hash}
              readonly
              classList={css({ fontFamily: "mono" })}
            />
          </FormField>
        )}
        {basicAuth && (
          <FormField
            id="basicAuth"
            label="Basic Auth Header"
          >
            <Input
              id="basicAuth"
              name="basicAuth"
              placeholder="Enter your Basic Auth header"
              aria-describedby="basicAuth-hint"
              value={basicAuth}
              readonly
              classList={css({ fontFamily: "mono" })}
            />
          </FormField>
        )}
      </Paper>
    </Layout>
  );
};
