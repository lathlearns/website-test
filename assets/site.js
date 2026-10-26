// Ancient Access: shared helpers for the pop-up, simple text formatting and
// reading SillyTavern card data out of PNG files.

const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

// Inline formatting inside the JSON text: **bold**, *italic*, `code`, [link](url).
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// Each string is a paragraph. Lines starting "- " become a bullet list and
// lines starting "1. " a numbered list (consecutive lines join up).
function blocks(items) {
  let html = "", list = null;
  for (const raw of items || []) {
    const m = raw.match(/^(- |\d+\. )(.*)$/s);
    const kind = m ? (m[1] === "- " ? "ul" : "ol") : null;
    if (list && list !== kind) { html += `</${list}>`; list = null; }
    if (kind) {
      if (!list) { html += `<${kind}>`; list = kind; }
      html += `<li>${inline(m[2])}</li>`;
    } else {
      html += `<p>${inline(raw)}</p>`;
    }
  }
  return list ? html + `</${list}>` : html;
}

// Tags match regardless of capitals or stray spaces. The label keeps the
// card's own spelling ("NSFW" stays NSFW), with a capital first letter.
const tagKey = t => String(t).trim().replace(/\s+/g, " ").toLowerCase();
const tagLabel = t => { t = String(t).trim().replace(/\s+/g, " "); return t.charAt(0).toUpperCase() + t.slice(1); };

// ---------- Card reading ----------
// SillyTavern stores the character as base64 JSON in a PNG text chunk named
// "ccv3" or "chara" (plain tEXt, compressed zTXt, or iTXt). It usually sits at
// the end of the file, so only the last 512 KB is fetched first.
const enc = new TextEncoder();
const latin1 = new TextDecoder("latin1");

async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function indexOf(buf, needle, from = 0) {
  outer: for (let i = from; i <= buf.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (buf[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

// Returns the chunk's text, null if absent, or "partial" if it runs past the buffer.
async function findText(buf, keyword) {
  for (const type of ["tEXt", "zTXt", "iTXt"]) {
    const at = indexOf(buf, enc.encode(type + keyword + "\0"));
    if (at < 4) continue;
    const len = new DataView(buf.buffer, buf.byteOffset + at - 4, 4).getUint32(0);
    if (at + 4 + len > buf.length) return "partial";
    let data = buf.subarray(at + 4 + keyword.length + 1, at + 4 + len);
    if (type === "zTXt") return latin1.decode(await inflate(data.subarray(1)));
    if (type === "iTXt") {
      const compressed = data[0] === 1;
      data = data.subarray(2);
      data = data.subarray(data.indexOf(0) + 1);      // language tag
      data = data.subarray(data.indexOf(0) + 1);      // translated keyword
      return new TextDecoder().decode(compressed ? await inflate(data) : data);
    }
    return latin1.decode(data);
  }
  return null;
}

async function readCard(url) {
  let res = await fetch(url, { headers: { Range: "bytes=-524288" } });
  let buf = new Uint8Array(await res.arrayBuffer());
  let raw = (await findText(buf, "ccv3")) ?? (await findText(buf, "chara"));
  if (raw === "partial" || (raw === null && res.status === 206)) {
    buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
    raw = (await findText(buf, "ccv3")) ?? (await findText(buf, "chara"));
  }
  if (!raw || raw === "partial") return null;
  const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw.trim()), ch => ch.charCodeAt(0))));
  return json.data || json;
}

// ---------- Detail pop-up ----------
// item: { name, tagline, art, tags[], tabs: [{ title, text[], warn }], downloads: [{ label, file }] }
let dlg;
function detail(item) {
  if (!dlg) {
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="detail" aria-labelledby="d-name">
        <div class="modal">
          <div class="art"></div>
          <div class="content">
            <div class="content-head">
              <button class="close" aria-label="Close">×</button>
              <h2 id="d-name"></h2>
              <p class="tagline"></p>
            </div>
            <div class="tags"></div>
            <div class="tabs" role="tablist"></div>
            <div class="pane"></div>
            <div class="actions"></div>
          </div>
        </div>
      </dialog>`);
    dlg = document.getElementById("detail");
    dlg.querySelector(".close").onclick = () => dlg.close();
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  }
  const $ = s => dlg.querySelector(s);
  $(".modal").classList.toggle("no-art", !item.art);
  $(".art").style.backgroundImage = item.art ? `url("${item.art.replace(/"/g, "%22")}")` : "";
  $("#d-name").textContent = item.name;
  $(".tagline").textContent = item.tagline || "";
  $(".tagline").hidden = !item.tagline;
  $(".tags").innerHTML = (item.tags || []).map(t => `<span>${esc(t)}</span>`).join("");
  $(".tags").hidden = !(item.tags || []).length;

  const tabs = $(".tabs"), pane = $(".pane");
  tabs.innerHTML = item.tabs.map((t, i) =>
    `<button role="tab" data-i="${i}" class="${i ? "" : "on"} ${t.warn ? "warn" : ""}">${esc(t.title)}</button>`).join("");
  const show = i => { pane.innerHTML = blocks(item.tabs[i].text); pane.scrollTop = 0; };
  tabs.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    tabs.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
    show(+b.dataset.i);
  };
  show(0);

  $(".actions").innerHTML = (item.downloads || []).map((d, i) => {
    const external = /^https?:/.test(d.file) && !d.file.startsWith(location.origin);
    return `<a class="btn ${i ? "" : "primary"}" href="${esc(d.file)}" ${external ? 'target="_blank" rel="noopener"' : "download"}>${esc(d.label)}</a>`;
  }).join("");
  $(".actions").hidden = !(item.downloads || []).length;
  dlg.showModal();
}
