// Return pages do not inspect, display or forward query payloads or fragments.
// Billing confirmation belongs to Stripe and the founder's billing workflow.
if (location.search || location.hash) history.replaceState(null, "", location.pathname);
