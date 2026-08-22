import { mountable, type TMountResult } from "./mountable.ts";
import { checkAndRotateKeys } from "./oidc/jwt.ts";

export interface TOidc {
  checkAndRotateKeys(): Promise<void>;
}

export const Oidc = mountable(async (): Promise<TMountResult<TOidc>> => {
  await checkAndRotateKeys();

  const rotationTimer = setInterval(() => {
    void checkAndRotateKeys();
  }, 60 * 60 * 1000);

  return {
    value: {
      checkAndRotateKeys,
    },
    unmount() {
      clearInterval(rotationTimer);
    },
  };
});
