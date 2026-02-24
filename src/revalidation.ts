import { revalidatePath, revalidateTag } from "next/cache";

interface RevalidatePayload {
  secret: string;
  paths?: string[];
  tags?: string[];
}

function runRevalidate(body: RevalidatePayload) {
  const revalidated: { paths: string[]; tags: string[] } = {
    paths: [],
    tags: [],
  };

  if (body.paths) {
    for (const path of body.paths) {
      revalidatePath(path);
      revalidated.paths.push(path);
    }
  }

  if (body.tags) {
    for (const tag of body.tags) {
      revalidateTag(tag);
      revalidated.tags.push(tag);
    }
  }

  return revalidated;
}

/**
 * Creates a POST handler for on-demand revalidation via webhooks.
 * Use when you need to pass a secret from a custom source.
 *
 * @param secret - Shared secret to authenticate incoming webhook requests
 */
export function createRevalidateHandler(secret: string) {
  return async function POST(req: Request) {
    const body: RevalidatePayload = await req.json();

    if (body.secret !== secret) {
      return Response.json({ message: "Invalid secret" }, { status: 401 });
    }

    const revalidated = runRevalidate(body);
    return Response.json({ revalidated, now: Date.now() });
  };
}

/**
 * Ready-to-use revalidation handler. Reads the secret from
 * `process.env.BREASE_REVALIDATION_SECRET`. Use in your app so the
 * package handles the webhook with no configuration:
 *
 * In `app/api/revalidate/route.ts`:
 * ```ts
 * export { revalidateHandler as POST } from 'brease-next/server';
 * ```
 *
 * Set BREASE_REVALIDATION_SECRET in your environment; the backend
 * sends this same secret when triggering revalidation.
 */
export async function revalidateHandler(req: Request) {
  const secret = process.env.BREASE_REVALIDATION_SECRET;
  if (!secret) {
    return Response.json(
      { message: "BREASE_REVALIDATION_SECRET is not set" },
      { status: 500 },
    );
  }

  const body: RevalidatePayload = await req.json();

  if (body.secret !== secret) {
    return Response.json({ message: "Invalid secret" }, { status: 401 });
  }

  const revalidated = runRevalidate(body);
  return Response.json({ revalidated, now: Date.now() });
}
