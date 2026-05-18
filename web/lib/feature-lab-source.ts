import type { ClaudeCodeFeature } from "./feature-lab";

export interface FeatureSourceEvidence {
  hasEvidence: boolean;
  quote: string | null;
  href: string | null;
  hostLabel: string;
  linkLabel: string | null;
  releaseLabel: string | null;
}

function getSafeHttpUrl(url: string): URL | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

function getHostLabel(url: URL): string {
  return url.hostname.replace(/^www\./, "");
}

export function formatFeatureSourceEvidence(
  feature: Pick<ClaudeCodeFeature, "source" | "introducedIn">,
): FeatureSourceEvidence {
  const source = feature.source;
  const quote = source?.quote?.trim() || null;
  const releaseLabel = source?.releaseVersion ?? feature.introducedIn ?? null;

  if (source?.url) {
    const safeUrl = getSafeHttpUrl(source.url);
    if (safeUrl) {
      const hostLabel = getHostLabel(safeUrl);
      return {
        hasEvidence: true,
        quote,
        href: safeUrl.toString(),
        hostLabel,
        linkLabel: hostLabel === "docs.anthropic.com" ? "Open Anthropic docs" : `Open ${hostLabel}`,
        releaseLabel,
      };
    }
  }

  if (source?.releaseVersion) {
    return {
      hasEvidence: true,
      quote,
      href: `/#release-${source.releaseVersion}`,
      hostLabel: "cc-release archive",
      linkLabel: `Release note ${source.releaseVersion}`,
      releaseLabel: source.releaseVersion,
    };
  }

  return {
    hasEvidence: Boolean(quote),
    quote,
    href: null,
    hostLabel: quote ? "curated note" : "no source",
    linkLabel: null,
    releaseLabel,
  };
}
