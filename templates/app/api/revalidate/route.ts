/**
 * Revalidation webhook endpoint. The package handles the request and
 * revalidates cache when the CMS sends a webhook — no configuration needed.
 * Ensure BREASE_REVALIDATION_SECRET is set in your environment.
 */
export { revalidateHandler as POST } from "brease-next/server";
