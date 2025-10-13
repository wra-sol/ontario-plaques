import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { renderToString } from "react-dom/server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext
) {
  const body = renderToString(
    <ServerRouter context={entryContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html; charset=utf-8");

  return new Response(`<!DOCTYPE html>${body}`, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
