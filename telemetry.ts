import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";
import denoJson from "./deno.json" with { type: "json" };

export const telemetryTracer = trace.getTracer(
  "auth-portal",
  denoJson.version,
);

export function recordSpanError(span: Span, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  span.recordException(error instanceof Error ? error : new Error(message));
  span.setStatus({ code: SpanStatusCode.ERROR, message });
}
