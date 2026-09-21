const { UAParser } = require("ua-parser-js");
const geoip = require("geoip-lite");
const Url = require("../model/UrlModel");
const Click = require("../model/ClickModel");

// Routine/diagnostic logging (geo lookups run on every click) — noisy in
// production, so only print it outside production. Real failures still use
// console.error further down so they always reach production logs.
const debugLog = (...args) => {
  if (process.env.NODE_ENV !== "production") console.log(...args);
};

/* ── ISO 3166-1 alpha-2 → full country name ──────────────────────────── */
const COUNTRY_NAMES = {
  AF:"Afghanistan",DZ:"Algeria",AO:"Angola",AR:"Argentina",AU:"Australia",
  AT:"Austria",AZ:"Azerbaijan",BH:"Bahrain",BD:"Bangladesh",BY:"Belarus",
  BE:"Belgium",BJ:"Benin",BO:"Bolivia",BA:"Bosnia and Herzegovina",BR:"Brazil",
  BG:"Bulgaria",KH:"Cambodia",CM:"Cameroon",CA:"Canada",CL:"Chile",
  CN:"China",CO:"Colombia",CD:"Congo",HR:"Croatia",CY:"Cyprus",
  CZ:"Czech Republic",DK:"Denmark",DO:"Dominican Republic",EC:"Ecuador",
  EG:"Egypt",SV:"El Salvador",ET:"Ethiopia",FI:"Finland",FR:"France",
  GA:"Gabon",GE:"Georgia",DE:"Germany",GH:"Ghana",GR:"Greece",GT:"Guatemala",
  HN:"Honduras",HK:"Hong Kong",HU:"Hungary",IN:"India",ID:"Indonesia",
  IQ:"Iraq",IE:"Ireland",IL:"Israel",IT:"Italy",JM:"Jamaica",JP:"Japan",
  JO:"Jordan",KZ:"Kazakhstan",KE:"Kenya",KW:"Kuwait",LB:"Lebanon",
  LY:"Libya",LT:"Lithuania",LU:"Luxembourg",MY:"Malaysia",ML:"Mali",
  MX:"Mexico",MA:"Morocco",MZ:"Mozambique",NL:"Netherlands",NZ:"New Zealand",
  NG:"Nigeria",NO:"Norway",OM:"Oman",PK:"Pakistan",PA:"Panama",PY:"Paraguay",
  PE:"Peru",PH:"Philippines",PL:"Poland",PT:"Portugal",PR:"Puerto Rico",
  QA:"Qatar",RO:"Romania",RU:"Russia",SA:"Saudi Arabia",SN:"Senegal",
  RS:"Serbia",SG:"Singapore",ZA:"South Africa",KR:"South Korea",ES:"Spain",
  LK:"Sri Lanka",SD:"Sudan",SE:"Sweden",CH:"Switzerland",SY:"Syria",
  TW:"Taiwan",TZ:"Tanzania",TH:"Thailand",TN:"Tunisia",TR:"Turkey",
  UG:"Uganda",UA:"Ukraine",AE:"UAE",GB:"United Kingdom",US:"United States",
  UY:"Uruguay",UZ:"Uzbekistan",VE:"Venezuela",VN:"Vietnam",YE:"Yemen",
  ZM:"Zambia",ZW:"Zimbabwe",
};

/* ── Detect real client IP, stripping IPv6-mapped IPv4 (::ffff:x.x.x.x) */
const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  let ip = forwarded
    ? forwarded.split(",")[0].trim()
    : req.socket?.remoteAddress || req.ip || "";

  // Strip IPv6-mapped IPv4 prefix so geoip-lite can resolve it
  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }
  return ip;
};

const isPrivateIp = (ip) => {
  return (
    !ip ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
};

/* ── Resolve this machine's real public IP (used when the visitor's IP is
   private/loopback, e.g. testing on localhost, so we still get a country) */
const getPublicIp = async () => {
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    return data.ip || null;
  } catch (e) {
    debugLog("Could not resolve public IP:", e.message);
    return null;
  }
};

/* ── Resolve country for a public IP.
   Tries a live lookup first (more accurate, up-to-date than the bundled
   geoip-lite flat-file DB), and falls back to geoip-lite if that fails. */
const lookupCountry = async (ip) => {
  // Provider 1: ip-api.com over HTTPS (some hosts block plain http:// outbound calls)
  try {
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    if (data.status === "success" && data.country) {
      return data.country;
    }
    debugLog("ip-api.com returned no country for", ip, "→", JSON.stringify(data));
  } catch (e) {
    debugLog("ip-api.com lookup failed for", ip, "→", e.message);
  }

  // Provider 2: ipapi.co as a second live fallback (different rate limits/host policy)
  try {
    const res2 = await fetch(`https://ipapi.co/${ip}/country_name/`, {
      signal: AbortSignal.timeout(4000),
    });
    const text = (await res2.text()).trim();
    if (res2.ok && text && !/error|undefined/i.test(text)) {
      return text;
    }
    debugLog("ipapi.co returned no usable country for", ip, "→", text);
  } catch (e) {
    debugLog("ipapi.co lookup failed for", ip, "→", e.message);
  }

  // Provider 3: local offline DB (last resort, can be stale)
  const geo = geoip.lookup(ip);
  if (geo?.country) {
    return COUNTRY_NAMES[geo.country] || geo.country;
  }
  debugLog("geoip-lite also has no entry for", ip);
  return "Unknown";
};

/* ── Pick a destination URL: weighted-random across variants if any exist,
   otherwise the link's main `url`. Also bumps the chosen variant's click
   counter so A/B results can be compared. */
const pickDestination = async (foundUrl) => {
  if (!foundUrl.variants || foundUrl.variants.length === 0) {
    return foundUrl.url;
  }
  const totalWeight = foundUrl.variants.reduce((sum, v) => sum + (v.weight || 1), 0);
  let roll = Math.random() * totalWeight;
  let chosen = foundUrl.variants[0];
  for (const v of foundUrl.variants) {
    roll -= v.weight || 1;
    if (roll <= 0) {
      chosen = v;
      break;
    }
  }
  chosen.clicks = (chosen.clicks || 0) + 1;
  return chosen.url;
};

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

/* ── Redirect short URL → original URL + record the click ────────────── */
const redirectShortUrl = async (req, res) => {
  try {
    const shortCode = req.params.code.trim();
    const foundUrl = await Url.findOne({ shortUrl: shortCode });

    if (!foundUrl) {
      return res.redirect(`${getFrontendUrl()}/not-found`);
    }

    if (foundUrl.expiresAt && new Date(foundUrl.expiresAt).getTime() < Date.now()) {
      return res.redirect(`${getFrontendUrl()}/not-found?reason=expired`);
    }

    const destination = await pickDestination(foundUrl);

    // Record click asynchronously — don't block the redirect
    recordClick(req, foundUrl._id).catch((e) => console.error("click log error:", e));

    foundUrl.clicksCount += 1;
    await foundUrl.save();

    return res.redirect(destination);
  } catch (err) {
    console.error(err);
    res.redirect(`${getFrontendUrl()}/not-found`);
  }
};

const recordClick = async (req, linkId) => {
  const ip = getClientIp(req);
  const ua = new UAParser(req.headers["user-agent"] || "");
  const result = ua.getResult();

  const deviceType = result.device.type || "desktop";

  // Geo lookup — private/loopback IPs (e.g. localhost during dev) can't be
  // geolocated directly, so resolve the machine's real public IP first.
  let country = "Unknown";
  let geoIp = ip;
  if (isPrivateIp(ip)) {
    debugLog("Click from private/local IP, resolving public IP instead:", ip);
    geoIp = await getPublicIp();
  }
  if (geoIp) {
    country = await lookupCountry(geoIp);
  }

  let referrer = "Direct";
  const ref = req.headers["referer"] || req.headers["referrer"];
  if (ref) {
    try {
      referrer = new URL(ref).hostname;
    } catch {
      referrer = "Direct";
    }
  }

  await Click.create({
    linkId,
    ip,
    country,
    device: deviceType === "mobile" || deviceType === "tablet" ? deviceType : "desktop",
    browser: result.browser.name || "Unknown",
    os: result.os.name || "Unknown",
    referrer,
  });
};

module.exports = { redirectShortUrl };