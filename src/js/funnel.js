// Attribution is a finite set of public campaign labels. No arbitrary values,
// identifiers, storage or analytics requests cross the navigation boundary.
export function withAttribution(destination, query, surface) {
  const incoming = new URLSearchParams(query);
  const campaign = incoming.getAll("utm_campaign");
  if (campaign.length !== 1 || campaign[0] !== "public-funnel-v1") return destination;
  if (!["landing", "showcase"].includes(surface)) return destination;
  const sources = incoming.getAll("utm_source");
  const source = sources.length === 1 && ["landing", "showcase", "founder-outreach"].includes(sources[0]) ? sources[0] : surface;
  const url = new URL(destination);
  url.search = "";
  url.searchParams.set("utm_campaign", campaign[0]);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", "referral");
  return url.href;
}

export function initFunnel(surface) {
  for (const link of document.querySelectorAll("a[data-funnel]")) {
    link.href = withAttribution(link.href, location.search, surface);
  }
}
