# Backend Changes Required

These are bugs and features that must be addressed in the Brease CMS backend. They cannot be fixed in the `brease-next` package alone.

## 1. Fix Page Detail Endpoint Response Format

**Endpoint:** `GET /environments/{env}/page?slug=...&locale=...`

### Current behavior (broken)

The endpoint returns OpenGraph fields in a **flat** format:

```json
{
  "openGraphUrl": null,
  "openGraphType": "website",
  "openGraphImage": null,
  "openGraphTitle": "Glassview | Works",
  "openGraphDescription": "Check out our high-impact, customized solutions here."
}
```

Missing entirely: `twitterCard`, `structuredData`, `canonicalUrl`, `additionalFields`, `alternateLinks`.

### Required behavior

Return all meta fields in **nested** format:

```json
{
  "name": "Works",
  "slug": "/works",
  "uuid": "...",
  "indexing": true,
  "metaTitle": "Glassview | Works",
  "metaDescription": "Check out our high-impact, customized solutions here.",
  "canonicalUrl": "https://glassview.com/works",
  "openGraph": {
    "url": "https://glassview.com/works",
    "type": "website",
    "image": "https://assets.brease.io/...",
    "title": "Glassview | Works",
    "description": "Check out our high-impact, customized solutions here."
  },
  "twitterCard": {
    "site": "@glassview",
    "type": "summary_large_image",
    "image": "https://assets.brease.io/...",
    "title": "Glassview | Works",
    "creator": null,
    "description": "Check out our high-impact, customized solutions here."
  },
  "structuredData": [],
  "alternateLinks": {
    "en": "/works",
    "ja": "/ja/sakuhin"
  },
  "sections": [...]
}
```

### Changes needed

- Return nested `openGraph: { type, title, description, image, url }` (not flat `openGraphTitle`, etc.)
- Return nested `twitterCard: { type, title, description, image, creator, site }`
- Always include `structuredData`, `canonicalUrl`, `additionalFields` (can be `null`/`[]`)
- Remove the `metaOnly` query param — the full response should always include all meta fields

## 2. Include Alternate Links in Page Detail Response

The page detail endpoint should include an `alternateLinks` field with the same shape as the `/page/alternate` endpoint returns:

```json
{
  "alternateLinks": {
    "en": "/about",
    "ja": "/ja/ni-tsuite",
    "de": "/de/uber-uns"
  }
}
```

This allows `generateBreasePageMetadata` to read alternate links directly without a separate API call. The standalone `/page/alternate` endpoint should continue to exist for other uses (e.g., navigation language switchers).

## 3. Fix Sitemap URL Generation

### Bug: Missing protocol

URLs are missing the `https://` protocol prefix.

- **Current:** `glassview.com/about`
- **Expected:** `https://glassview.com/about`

### Bug: Doubled locale in Japanese alternate URLs

Japanese alternate URLs have the locale path segment duplicated.

- **Current:** `glassview.com/ja/ja/about`
- **Expected:** `https://glassview.com/ja/about`

## 4. Add Webhook on Content Publish

See [webhook-implementation.md](./webhook-implementation.md) for the full specification.

### Summary

When content is published/updated/deleted, the backend should POST to the consumer's revalidation endpoint:

```
POST {site.webhookUrl}/api/revalidate
Content-Type: application/json

{
  "secret": "{site.revalidationSecret}",
  "tags": ["brease-page", "brease-page-{slug}"]
}
```

This requires two new fields on the Site/Environment model:

- `webhookUrl` — the consumer's deployed site URL
- `revalidationSecret` — a shared secret for authentication
