"use strict";

// ---------- Clock + greeting ----------
function tick() {
  const now = new Date();
  const h = now.getHours();
  document.getElementById("greeting").textContent =
    h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  document.getElementById("clock").textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  document.getElementById("date").textContent = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
tick();
setInterval(tick, 1000);

// ---------- Proxy ----------
const frame = document.getElementById("proxy-container");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

function toUrl(input) {
  input = input.trim();
  if (!input) return null;
  try {
    return new URL(input).toString();
  } catch {}
  if (input.includes(".") && !input.includes(" ")) {
    return "https://" + input;
  }
  return "https://duckduckgo.com/?q=" + encodeURIComponent(input);
}

async function openProxied(input) {
  const url = toUrl(input);
  if (!url) return;

  if (!navigator.serviceWorker) {
    alert("Service workers need HTTPS and a supported browser.");
    return;
  }

  try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: __uv$config.prefix,
    });
    const worker = reg.installing || reg.waiting || reg.active;
    if (worker && worker.state !== "activated") {
      await new Promise((resolve, reject) => {
        worker.addEventListener("statechange", () => {
          if (worker.state === "activated") resolve();
          if (worker.state === "redundant") reject(new Error("Service worker failed to install"));
        });
      });
    }
    const wisp =
      (location.protocol === "https:" ? "wss" : "ws") +
      "://" + location.host + "/wisp/";
    await connection.setTransport("/epoxy/index.mjs", [{ wisp }]);

    frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
    frame.classList.add("active");
  } catch (err) {
    console.error("Proxy error:", err);
    alert("Proxy failed: " + err.message);
  }
}

document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  openProxied(document.getElementById("search-input").value);
});

document.querySelectorAll(".tile").forEach((tile) => {
  tile.addEventListener("click", () => openProxied(tile.dataset.dest));
});

// Press Escape to close the proxied page and return to the dashboard
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    frame.classList.remove("active");
    frame.src = "about:blank";
  }
});
// Open a destination passed as ?url=... (runs the full startup first)
const dest = new URLSearchParams(location.search).get("url");
if (dest) openProxied(dest);
