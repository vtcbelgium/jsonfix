/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";
import robotsTxt from "../public/robots.txt?raw";
import sitemapXml from "../public/sitemap.xml?raw";
import styleCss from "./style.css?raw";

const SITE_URL = "https://jsonfix.othrys.be/";

interface FaqEntry {
  "@type": string;
  name: string;
  acceptedAnswer: { "@type": string; text: string };
}

function metaContent(attribute: "name" | "property", key: string): string | undefined {
  const tag = indexHtml.match(new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="([^"]*)"`));
  return tag?.[1];
}

function jsonLdBlocks(): Array<Record<string, unknown>> {
  const blocks = indexHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  return [...blocks].map((block) => JSON.parse(block[1]));
}

function faqEntries(): FaqEntry[] {
  const faqPage = jsonLdBlocks().find((block) => block["@type"] === "FAQPage");
  return (faqPage?.mainEntity ?? []) as FaqEntry[];
}

function faqSection(): string {
  return indexHtml.match(/<section\s+class="faq"[\s\S]*?<\/section>/)?.[0] ?? "";
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function visibleFaq(): Array<{ question: string; answer: string }> {
  const items = faqSection().matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g);
  return [...items].map((item) => ({
    question: plainText(item[1]),
    answer: plainText(item[2]),
  }));
}

describe("robots.txt", () => {
  it("allows all crawlers", () => {
    expect(robotsTxt).toMatch(/^User-agent: \*$/m);
    expect(robotsTxt).toMatch(/^Allow: \/$/m);
    expect(robotsTxt).not.toMatch(/^Disallow: \/\s*$/m);
  });

  it("references the sitemap", () => {
    expect(robotsTxt).toMatch(/^Sitemap: https:\/\/jsonfix\.othrys\.be\/sitemap\.xml$/m);
  });
});

describe("sitemap.xml", () => {
  it("lists the canonical URL as the only location", () => {
    expect([...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((loc) => loc[1])).toEqual([SITE_URL]);
  });

  it("has a real lastmod date", () => {
    const lastmod = sitemapXml.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/)?.[1] ?? "";
    expect(Number.isNaN(Date.parse(lastmod))).toBe(false);
  });

  it("declares daily changefreq and priority 1.0", () => {
    expect(sitemapXml).toContain("<changefreq>daily</changefreq>");
    expect(sitemapXml).toContain("<priority>1.0</priority>");
  });
});

describe("index.html metadata", () => {
  it("has a canonical link", () => {
    expect(indexHtml).toContain(`<link rel="canonical" href="${SITE_URL}" />`);
  });

  it("has a meta description of useful length", () => {
    const description = metaContent("name", "description") ?? "";
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("has meta keywords", () => {
    expect(metaContent("name", "keywords")).toContain("json repair");
  });

  it("has the required OpenGraph tags", () => {
    expect(metaContent("property", "og:title")).toBeTruthy();
    expect(metaContent("property", "og:description")).toBeTruthy();
    expect(metaContent("property", "og:type")).toBe("website");
    expect(metaContent("property", "og:image")).toBe(`${SITE_URL}og-image.png`);
  });

  it("ships the image that og:image points to", () => {
    expect(Object.keys(import.meta.glob("../public/*.png"))).toContain("../public/og-image.png");
  });
});

describe("FAQ", () => {
  it("is a section labelled by its visible heading", () => {
    expect(faqSection()).toContain('aria-labelledby="faq-heading"');
    expect(faqSection()).toMatch(/<h2 id="faq-heading">/);
  });

  it("answers the four core questions", () => {
    expect(visibleFaq().map(({ question }) => question)).toEqual([
      "Why did my JSON fail to parse?",
      "How does JSONFix repair broken JSON?",
      "Does my data get sent to a remote server?",
      "What syntax errors are automatically repaired?",
    ]);
  });

  it("highlights that processing is private and in the browser", () => {
    const privacyItem = faqSection().match(/remote server\?<\/h3>\s*<p>([\s\S]*?)<\/p>/)?.[1] ?? "";
    expect(privacyItem).toContain("<strong>100% private</strong>");
    expect(plainText(privacyItem)).toContain("in your browser");
  });

  it("names every repaired syntax error", () => {
    const repairs = visibleFaq()[3]?.answer ?? "";
    for (const repair of ["trailing commas", "unquoted keys", "single quotes"]) {
      expect(repairs.toLowerCase()).toContain(repair);
    }
    for (const literal of ["True", "False", "None"]) {
      expect(repairs).toContain(literal);
    }
  });
});

describe("JSON-LD", () => {
  it("parses every block as schema.org data", () => {
    expect(jsonLdBlocks().length).toBeGreaterThanOrEqual(2);
    for (const block of jsonLdBlocks()) {
      expect(block["@context"]).toBe("https://schema.org");
    }
  });

  it("has a valid FAQPage with at least four Q&As", () => {
    expect(faqEntries().length).toBeGreaterThanOrEqual(4);
    for (const entry of faqEntries()) {
      expect(entry["@type"]).toBe("Question");
      expect(entry.name).toBeTruthy();
      expect(entry.acceptedAnswer["@type"]).toBe("Answer");
      expect(entry.acceptedAnswer.text).toBeTruthy();
    }
  });

  it("matches the visible FAQ word for word", () => {
    const schema = faqEntries().map((entry) => ({
      question: entry.name,
      answer: entry.acceptedAnswer.text,
    }));
    expect(schema).toEqual(visibleFaq());
  });
});

describe("accessibility markup", () => {
  it("has a polite live region for fix and error announcements", () => {
    expect(indexHtml).toMatch(
      /<div id="live-status" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"><\/div>/,
    );
  });

  it("labels both editors", () => {
    expect(indexHtml).toMatch(/<label for="input-json"/);
    expect(indexHtml).toMatch(/<label for="output-json"/);
  });

  it("keeps a single h1", () => {
    expect(indexHtml.match(/<h1[ >]/g)).toHaveLength(1);
  });
});

describe("accessibility styles", () => {
  type Tokens = Record<string, string>;

  function tokensIn(css: string): Tokens {
    const declarations = css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g);
    return Object.fromEntries([...declarations].map((token) => [token[1], token[2]]));
  }

  const [darkCss, lightCss] = styleCss.split("@media (prefers-color-scheme: light)");
  const dark = tokensIn(darkCss.slice(0, darkCss.indexOf("}")));
  const light = { ...dark, ...tokensIn(lightCss.slice(0, lightCss.indexOf("}"))) };

  function rgb(hex: string): number[] {
    return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  }

  function luminance(channels: number[]): number {
    const [r, g, b] = channels
      .map((channel) => channel / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrast(foreground: number[], background: number[]): number {
    const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function tint(color: string, background: string, alpha: number): number[] {
    const backgroundChannels = rgb(background);
    return rgb(color).map((channel, i) => channel * alpha + backgroundChannels[i] * (1 - alpha));
  }

  describe.each([
    ["dark", dark],
    ["light", light],
  ])("%s theme", (_name, theme) => {
    it.each([
      ["text-main", "bg-page"],
      ["text-main", "bg-card"],
      ["text-muted", "bg-page"],
      ["text-muted", "bg-card"],
      ["accent", "bg-page"],
      ["accent", "bg-card"],
      ["on-accent", "accent"],
    ])("%s on %s meets 4.5:1", (foreground, background) => {
      expect(contrast(rgb(theme[foreground]), rgb(theme[background]))).toBeGreaterThanOrEqual(4.5);
    });

    it.each(["accent", "success", "error"])("%s badge text meets 4.5:1 on its tint", (token) => {
      const badge = tint(theme[token], theme["bg-card"], 0.15);
      expect(contrast(rgb(theme[token]), badge)).toBeGreaterThanOrEqual(4.5);
    });

    it("has an editor border of at least 3:1", () => {
      const ratio = contrast(rgb(theme["border-control"]), rgb(theme["bg-card"]));
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });

  it("shows a focus outline on every interactive element", () => {
    expect(styleCss).toMatch(
      /a:focus-visible,\s*button:focus-visible,\s*textarea:focus-visible\s*{\s*outline: 2px solid var\(--accent\)/,
    );
    expect(styleCss).not.toContain("outline: none");
  });
});

describe("google ecosystem hygiene", () => {
  it("includes Googlebot snippet and image preview directives", () => {
    expect(indexHtml).toMatch(/<meta\s+name="robots"\s+content="[^"]*max-image-preview:large[^"]*"/);
    expect(indexHtml).toMatch(/<meta\s+name="robots"\s+content="[^"]*max-snippet:-1[^"]*"/);
  });

  it("includes theme-color for mobile search UX", () => {
    expect(indexHtml).toMatch(/<meta\s+name="theme-color"\s+content="#[0-9a-fA-F]{6}"/);
  });

  it("provides complete WebApplication metadata for rich snippets", () => {
    const webApp = jsonLdBlocks().find((b) => b["@type"] === "WebApplication") as Record<string, unknown>;
    expect(webApp).toBeDefined();
    expect(webApp.operatingSystem).toBe("All");
    expect(webApp.browserRequirements).toContain("JavaScript");
    expect(webApp.offers).toEqual(expect.objectContaining({ price: "0" }));
  });

  it("defines standard 1200x630 OpenGraph card with alt text", () => {
    expect(indexHtml).toContain('<meta property="og:image:width" content="1200" />');
    expect(indexHtml).toContain('<meta property="og:image:height" content="630" />');
    expect(indexHtml).toContain('property="og:image:alt"');
  });
});
