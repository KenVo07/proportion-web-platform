// Example appointment dates in the illustrations: the next Tuesday at least two days away, in
// Melbourne time, so the mock-ups never show a date in the past. Without JavaScript the markup just
// says "Tuesday".
export function initDates(now = new Date()) {
  const tz = "Australia/Melbourne";
  const fmt = (opts) => new Intl.DateTimeFormat("en-AU", { timeZone: tz, ...opts });
  const weekday = fmt({ weekday: "long" });
  let day = null;
  for (let i = 2; i < 10; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    if (weekday.format(d) === "Tuesday") { day = d; break; }
  }
  if (!day) return;
  const part = (opts) => fmt(opts).format(day);
  const long = `${part({ weekday: "long" })} ${part({ day: "numeric" })} ${part({ month: "long" })}`;
  const short = `${part({ weekday: "short" })} ${part({ day: "numeric" })} ${part({ month: "short" })}`;
  for (const el of document.querySelectorAll('[data-date="long"]')) el.textContent = long;
  for (const el of document.querySelectorAll('[data-date="short"]')) el.textContent = short;
}
