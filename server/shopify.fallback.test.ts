import { afterEach, describe, expect, it } from "vitest";
import { isShopifyConfigured, listProducts } from "./_core/shopify";

const originalDomain = process.env.SHOPIFY_STORE_DOMAIN;
const originalToken = process.env.SHOPIFY_STOREFRONT_API_ACCESS_TOKEN;

afterEach(() => {
  if (originalDomain === undefined) delete process.env.SHOPIFY_STORE_DOMAIN;
  else process.env.SHOPIFY_STORE_DOMAIN = originalDomain;

  if (originalToken === undefined) delete process.env.SHOPIFY_STOREFRONT_API_ACCESS_TOKEN;
  else process.env.SHOPIFY_STOREFRONT_API_ACCESS_TOKEN = originalToken;
});

describe("Shopify catalog fallback", () => {
  it("returns an empty product list instead of throwing when Shopify is unconfigured", async () => {
    delete process.env.SHOPIFY_STORE_DOMAIN;
    delete process.env.SHOPIFY_STOREFRONT_API_ACCESS_TOKEN;

    expect(isShopifyConfigured()).toBe(false);
    await expect(listProducts({ first: 24 })).resolves.toEqual([]);
  });
});
