// site.config.json is the release authority. Export only public destinations,
// never founder contact details, runtime configuration or provider identifiers.
export function founderContactConfigured(contact = {}) {
  const fail = (name) => { throw new Error(`site.config.json: contact.${name} is not a valid public contact route`); };
  if (contact.linkedin && !/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s"'<>/]+\/?$/.test(contact.linkedin)) fail("linkedin");
  if (contact.email && !/^[^\s@"'<>]+@[^\s@"'<>]+\.[a-z]{2,}$/i.test(contact.email)) fail("email");
  if (contact.bookingUrl) {
    if (!/^https:\/\/[^\s"'<>]+$/.test(contact.bookingUrl)) fail("bookingUrl");
    let url;
    try { url = new URL(contact.bookingUrl); } catch { fail("bookingUrl"); }
    if (url.username || url.password || /(^|\.)stripe\.com$/i.test(url.hostname) || /(?:^|\/)(buy|pay|checkout|payments?|subscribe)(?:[/?.#]|$)/i.test(url.pathname)) fail("bookingUrl");
  }
  return [contact.linkedin, contact.email, contact.bookingUrl].some(Boolean);
}

export function canonicalFunnel(config) {
  const fail = (message) => { throw new Error(`site.config.json: ${message}`); };
  let site;
  try { site = new URL(config.siteUrl); } catch { fail("siteUrl must be a public https origin with a trailing slash"); }
  if (site.protocol !== "https:" || config.siteUrl !== `${site.origin}/` || site.port ||
      !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(site.hostname) ||
      /(^|[.-])(localhost|local|preview|founder|dev|debug|staging)([.-]|$)/i.test(site.hostname) ||
      /(^|\.)stripe\.com$/i.test(site.hostname)) fail("siteUrl must be a public https origin with a trailing slash");
  if (config.showcase?.url !== "https://demo.proportion.systems/") fail("showcase.url must be exactly https://demo.proportion.systems/");
  founderContactConfigured(config.contact);
  const at = (path) => new URL(path, site).href;
  return {
    version: 1, publicSiteUrl: site.href, showcaseUrl: config.showcase.url,
    contactUrl: at("#contact"),
    billingReturnUrls: { success: at("billing-success.html"), cancel: at("billing-cancel.html"), portal: at("billing-return.html") },
  };
}
