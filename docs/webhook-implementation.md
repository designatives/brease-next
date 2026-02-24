# Webhook Implementation Spec — On-Demand Revalidation

## Overview

When an editor publishes or modifies content in the Brease CMS, the consumer's Next.js site needs to be notified so it can invalidate its cache and serve fresh content to the next visitor.

This is achieved via **webhooks**: the CMS backend sends an HTTP POST to the consumer's revalidation endpoint with the relevant cache tags. Next.js then invalidates those specific cached entries, and the next request triggers a fresh fetch from the API.

```
┌──────────────────┐         POST /api/revalidate          ┌──────────────────────┐
│   Brease CMS     │ ──────────────────────────────────────▶│  Consumer Next.js    │
│   Backend        │   { secret, tags }                     │  App                 │
│                  │                                        │                      │
│  Editor publishes│                                        │  revalidateTag()     │
│  content         │◀──────────────────────────────────────│  invalidates cache   │
│                  │   200 { revalidated, now }             │                      │
└──────────────────┘                                        └──────────────────────┘
                                                                     │
                                                                     ▼
                                                            Next visitor gets
                                                            fresh content
```

## Site/Environment Configuration

Two new fields are needed on the **Site** or **Environment** model in the CMS:

| Field | Type | Description |
|---|---|---|
| `webhookUrl` | `string` (nullable) | The consumer's deployed site URL (e.g., `https://example.com`). When set, webhooks are active. When null/empty, webhooks are disabled. |
| `revalidationSecret` | `string` | A shared secret for authenticating webhook requests. Should be generated automatically when first set (e.g., UUID v4 or 32-char random string). |

These fields should be configurable per environment, allowing staging and production sites to have different webhook URLs.

## Webhook Payload

When a revalidation-triggering action occurs, the backend sends:

```
POST {webhookUrl}/api/revalidate
Content-Type: application/json

{
  "secret": "{revalidationSecret}",
  "tags": ["brease-page", "brease-page-about-us"]
}
```

### Payload Schema

```typescript
interface RevalidatePayload {
  secret: string;      // Must match the site's revalidationSecret
  paths?: string[];    // Optional: specific URL paths to revalidate
  tags?: string[];     // Cache tags to invalidate
}
```

In most cases, only `tags` are needed. `paths` can be used as a fallback for full-path invalidation if needed.

## Tag Naming Convention

Tags must match exactly what the `brease-next` package uses in its fetch calls. Here is the complete mapping:

### Page Published / Updated / Deleted

```json
{
  "secret": "...",
  "tags": ["brease-page", "brease-page-{slug}"]
}
```

The `{slug}` is the page's slug without a leading slash (e.g., `about-us`, `services/web-development`). For the homepage, use `brease-page-/`.

Also include `brease-sitemap` and `brease-pages` since page changes affect the sitemap and the pages list:

```json
{
  "secret": "...",
  "tags": ["brease-page", "brease-page-{slug}", "brease-pages", "brease-sitemap"]
}
```

### Navigation Updated

```json
{
  "secret": "...",
  "tags": ["brease-nav", "brease-nav-{navigationId}"]
}
```

### Collection Updated

```json
{
  "secret": "...",
  "tags": ["brease-collection", "brease-collection-{collectionId}"]
}
```

### Collection Entry Published / Updated / Deleted

```json
{
  "secret": "...",
  "tags": ["brease-entry", "brease-entry-{entryId}"]
}
```

### Locale Added / Removed

```json
{
  "secret": "...",
  "tags": ["brease-locales"]
}
```

### Site Settings Changed

```json
{
  "secret": "...",
  "tags": ["brease-site"]
}
```

### Redirect Created / Updated / Deleted

```json
{
  "secret": "...",
  "tags": ["brease-redirects"]
}
```

### Full Site Revalidation (Nuclear Option)

For rare cases where everything needs to be refreshed (e.g., domain change, major migration):

```json
{
  "secret": "...",
  "tags": [
    "brease-page",
    "brease-pages",
    "brease-nav",
    "brease-collection",
    "brease-entry",
    "brease-locales",
    "brease-site",
    "brease-sitemap",
    "brease-alternates",
    "brease-redirects"
  ]
}
```

## When to Fire Webhooks

| CMS Action | Tags to Include |
|---|---|
| Page published | `brease-page`, `brease-page-{slug}`, `brease-pages`, `brease-sitemap` |
| Page updated | `brease-page`, `brease-page-{slug}` |
| Page deleted | `brease-page`, `brease-page-{slug}`, `brease-pages`, `brease-sitemap` |
| Page slug changed | `brease-page-{oldSlug}`, `brease-page-{newSlug}`, `brease-pages`, `brease-sitemap` |
| Navigation item added/moved/deleted | `brease-nav`, `brease-nav-{navId}` |
| Collection entry published/updated/deleted | `brease-entry`, `brease-entry-{entryId}`, `brease-collection`, `brease-collection-{colId}` |
| Redirect created/updated/deleted | `brease-redirects` |
| Site settings changed | `brease-site` |
| Locale added/removed | `brease-locales` |

## Endpoint Spec

The **consumer app does not configure the webhook**. The `brease-next` package provides the handler; the app only exposes the route so the backend can POST to it. In the Next.js app, add a single file:

```
app/api/revalidate/route.ts
```

With one line:

```ts
export { revalidateHandler as POST } from 'brease-next/server';
```

The handler reads `BREASE_REVALIDATION_SECRET` from the environment and performs revalidation. No other configuration in the client app.

Your backend sends:

```
POST {webhookUrl}/api/revalidate
```

### Request

```
Content-Type: application/json

{
  "secret": "the-shared-secret",
  "tags": ["brease-page-about-us"]
}
```

### Responses

**200 OK** — Tags invalidated successfully:

```json
{
  "revalidated": {
    "paths": [],
    "tags": ["brease-page-about-us"]
  },
  "now": 1703001234567
}
```

**401 Unauthorized** — Secret doesn't match:

```json
{
  "message": "Invalid secret"
}
```

## Error Handling & Retry Policy

- **Never block the publish action.** Webhook delivery should be fire-and-forget from the editor's perspective. If the webhook fails, the content is still published in the CMS.
- **Retry on failure.** On non-2xx responses or network errors, retry up to 3 times with exponential backoff:
  - 1st retry: 2 seconds
  - 2nd retry: 4 seconds
  - 3rd retry: 8 seconds
- **Log failures.** Record webhook delivery attempts with status codes for debugging. Consider a webhook delivery log visible in the CMS admin panel.
- **Timeout.** Set a 10-second timeout for each webhook request. If the consumer doesn't respond in time, treat as a failure and retry.

## Multiple Environments

Each environment (staging, production) should have its own `webhookUrl` and `revalidationSecret`. This allows:

- Staging site at `https://staging.example.com` with its own secret
- Production site at `https://example.com` with a different secret
- Preview/develop environments can leave `webhookUrl` empty (the package uses `cache: 'no-store'` for these)

When content is published, the webhook should be sent to **all environments** that have a configured `webhookUrl`, not just the current one. For example, publishing a page in the staging environment might also need to trigger a webhook to the production site if the content propagates.

## Implementation Checklist

- [ ] Add `webhookUrl` and `revalidationSecret` fields to Site/Environment model
- [ ] Build UI in CMS admin to configure these fields
- [ ] Implement webhook sender service (HTTP POST with retry logic)
- [ ] Hook into all publish/update/delete actions listed above
- [ ] Add webhook delivery logging
- [ ] Test with `brease-next` revalidation endpoint (consumer uses `revalidateHandler` from `brease-next/server`)

## Related: Backend Changes for Page Detail Endpoint

In addition to webhooks, the page detail endpoint (`/environments/{env}/page?slug=...&locale=...`) requires the following changes:

1. **Nested format**: Return `openGraph`, `twitterCard` as nested objects (not flat `openGraphTitle`, etc.)
2. **Include all meta fields**: `structuredData`, `canonicalUrl`, `additionalFields`, `alternateLinks`
3. **Remove `metaOnly` param**: The full response should always include all meta fields
4. **Alternate links**: Include an `alternateLinks` field (same shape as `/page/alternate` endpoint)

See the plan's Part 10 for full details on these backend changes.
