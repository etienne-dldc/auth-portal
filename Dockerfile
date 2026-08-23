FROM denoland/deno:2.7.13

WORKDIR /app

COPY . .

# Pre-cache remote dependencies at build time to speed up startup.
RUN deno cache main.tsx

# Pre-download native libraries (sqlite, argon2) loaded lazily by plug.
RUN printf 'import { Database } from "@db/sqlite";\nnew Database(":memory:").close();\nimport { hash } from "@felix/argon2";\nawait hash("test");\n' > _preload.ts && deno run -A _preload.ts && rm _preload.ts

ENV PORT=3000
ENV OTEL_DENO=true
ENV OTEL_SERVICE_NAME=auth-portal
EXPOSE 3000

CMD ["task", "start"]
