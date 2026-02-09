(() => {
  const JSON_URL = "./assets/imgs/images.json";
  const IMG_BASE = "./assets/imgs/";

  function safeFileUrl(file) {
    // Handles spaces and special chars in filenames
    return IMG_BASE + encodeURIComponent(file);
  }

  // Deterministic pseudo-random so “scattered” positions stay stable per index
  function prand(i) {
    const x = Math.sin(i * 999) * 10000;
    return x - Math.floor(x);
  }

  function applyScatterVars(el, i) {
    // These CSS variables are harmless if your CSS doesn’t use them,
    // but if it does (common for dotted/scattered layouts), it keeps the style.
    const rx = prand(i * 3 + 1);
    const ry = prand(i * 3 + 2);
    const rr = prand(i * 3 + 3);

    // positions in % (tweak ranges if needed)
    const left = 5 + rx * 90;   // 5%..95%
    const top = 5 + ry * 90;    // 5%..95%
    const rot = -8 + rr * 16;   // -8deg..+8deg

    el.style.setProperty("--x", `${left}%`);
    el.style.setProperty("--y", `${top}%`);
    el.style.setProperty("--r", `${rot}deg`);
    el.style.setProperty("--i", `${i}`);
  }

  function setImageAndLink(root, file, title) {
    const url = safeFileUrl(file);

    // Update <img>
    const img = root.querySelector("img");
    if (img) {
      img.src = url;
      img.alt = title || "";
      img.loading = "lazy";
      img.decoding = "async";
    }

    // Update link for lightbox if present
    const a = root.matches("a") ? root : root.querySelector("a");
    if (a) {
      a.href = url;
      // Keep fancybox if you already use it
      if (!a.dataset.fancybox) a.dataset.fancybox = "gallery";
      if (title) a.dataset.caption = title;
    }

    // If you store title in an element (caption), try to fill it
    const cap =
      root.querySelector("[data-title]") ||
      root.querySelector(".caption") ||
      root.querySelector(".title");

    if (cap && title) cap.textContent = title;
  }

  async function load() {
    const gallery = document.getElementById("gallery");
    if (!gallery) return;

    let data;
    try {
      const res = await fetch(JSON_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to fetch ${JSON_URL} (${res.status})`);
      data = await res.json();
    } catch (e) {
      console.error(e);
      gallery.innerHTML = `
        <p style="max-width: 48rem; margin: 2rem auto; color: #666; line-height: 1.6;">
          Could not load gallery manifest (<code>${JSON_URL}</code>).
          Make sure it exists in the deployed site and is valid JSON.
        </p>
      `;
      return;
    }

    const images = Array.isArray(data.images) ? data.images : [];
    if (!images.length) {
      gallery.innerHTML = `<p style="text-align:center; color:#666; margin-top:2rem;">No images found.</p>`;
      return;
    }

    // --- IMPORTANT PART: preserve your layout ---
    // We look for a “blueprint” element already in the gallery.
    // This should carry your existing classes/structure.
    const blueprint =
      gallery.querySelector("[data-gallery-item]") ||
      gallery.querySelector(".gallery-item") ||
      gallery.querySelector("a") ||
      gallery.querySelector("div");

    // If there was placeholder content, clear it AFTER grabbing blueprint
    gallery.innerHTML = "";

    images.forEach((it, i) => {
      const title = it?.title ?? "";
      const file = it?.file ?? "";
      if (!file) return;

      let node;

      if (blueprint) {
        // Clone the existing structure so CSS keeps working
        node = blueprint.cloneNode(true);

        // Remove duplicate IDs if any
        node.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

        // Mark it, useful for debugging
        node.setAttribute("data-gallery-item", "1");
      } else {
        // Fallback minimal structure (should not happen in your setup)
        node = document.createElement("a");
        node.dataset.fancybox = "gallery";
        node.appendChild(document.createElement("img"));
      }

      // Keep your original classes intact. Only change src/href/text.
      setImageAndLink(node, file, title);

      // Optional: keep scattered layout consistent if your CSS uses these vars
      applyScatterVars(node, i);

      gallery.appendChild(node);
    });
  }

  document.addEventListener("DOMContentLoaded", load);
})();