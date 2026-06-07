import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root } from "mdast"

// Quartz port of the "molecule-embeds" Obsidian plugin.
// Renders ```smiles / ```mol code blocks as 2D skeletal molecules via RDKit.js.
// RDKit_minimal.js + RDKit_minimal.wasm live in quartz/static/rdkit/.

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const css = `
.mol-container {
  background: #000000;
  border-radius: 8px;
  padding: 12px 16px 16px;
  margin: 12px 0;
  user-select: none;
  position: relative;
}
.mol-svg-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}
.mol-svg-wrapper svg { max-width: 100%; height: auto; }
.mol-copy-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #333;
  border-radius: 4px;
  color: #555;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.mol-copy-btn:hover { color: #aaa; border-color: #555; }
.mol-copy-btn--done { color: #4ade80; border-color: #4ade80; }
.mol-error { color: #e05050; font-size: 13px; text-align: center; margin: 0; }
.mol-loading { color: #666; font-size: 13px; text-align: center; margin: 0; font-style: italic; }
`

// Path to the RDKit assets, served from quartz/static -> /static
const RDKIT_DIR = "/static/rdkit/"

const script = `
const ATOM_COLOURS = {
  "1":[0.75,0.75,0.75],"6":[1,1,1],"7":[0.2,0.4,1],"8":[1,0.2,0.2],
  "9":[0.2,0.9,0.2],"15":[1,0.6,0],"16":[0.2,0.9,0.2],"17":[0.2,0.9,0.2],
  "35":[0.6,0.2,0],"53":[0.4,0,0.6],
};
const DRAW_DETAILS = JSON.stringify({
  width: 650, height: 500, bondLineWidth: 1.2,
  backgroundColour: [0,0,0,1], atomColourPalette: ATOM_COLOURS,
  addAtomIndices: false, addBondIndices: false, addStereoAnnotation: false,
  explicitMethyl: false, padding: 0.15,
});

function patchSvgBackground(svg) {
  return svg.replace(/fill:#ffffff[^"]*"/gi, 'fill:#000000"').replace(/fill:white[^"]*"/gi, 'fill:black"');
}
function autoSize(svg, containerWidth) {
  const vbMatch = svg.match(/viewBox="([^"]+)"/);
  if (!vbMatch) return svg;
  const parts = vbMatch[1].split(" ").map(Number);
  const vw = parts[2], vh = parts[3];
  const aspect = vw / vh;
  const w = Math.min(containerWidth || 600, vw);
  const h = w / aspect;
  return svg.replace(/width="[^"]*"/, 'width="' + w + '"').replace(/height="[^"]*"/, 'height="' + h + '"');
}
async function svgToPngBlob(svgEl) {
  const data = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth * 2;
  canvas.height = img.naturalHeight * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
}

function loadRDKit() {
  if (window.__rdkitPromise) return window.__rdkitPromise;
  window.__rdkitPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "${RDKIT_DIR}RDKit_minimal.js";
    s.onload = () => {
      window.initRDKitModule({ locateFile: (f) => "${RDKIT_DIR}" + f })
        .then(resolve).catch(reject);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return window.__rdkitPromise;
}

function renderMolecule(container, rdkit) {
  const smiles = (container.dataset.smiles || "").trim();
  container.innerHTML = "";
  if (!smiles) {
    const p = document.createElement("p");
    p.className = "mol-error"; p.textContent = "Empty SMILES string.";
    container.appendChild(p); return;
  }
  const wrapper = document.createElement("div");
  wrapper.className = "mol-svg-wrapper";
  container.appendChild(wrapper);

  let mol = null;
  try {
    mol = rdkit.get_mol(smiles);
    if (!mol || !mol.is_valid()) {
      wrapper.innerHTML = '<p class="mol-error">Invalid SMILES: ' + smiles + '</p>';
      return;
    }
    let svg = mol.get_svg_with_highlights(DRAW_DETAILS);
    svg = patchSvgBackground(svg);
    svg = autoSize(svg, wrapper.clientWidth);
    wrapper.innerHTML = svg;
  } catch (e) {
    wrapper.innerHTML = '<p class="mol-error">Render error: ' + e.message + '</p>';
    return;
  } finally {
    if (mol) mol.delete();
  }

  const btn = document.createElement("button");
  btn.className = "mol-copy-btn";
  btn.setAttribute("aria-label", "Copy image");
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  btn.addEventListener("click", async () => {
    const svgEl = wrapper.querySelector("svg");
    if (!svgEl) return;
    try {
      const b = await svgToPngBlob(svgEl);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]);
      btn.classList.add("mol-copy-btn--done");
      setTimeout(() => btn.classList.remove("mol-copy-btn--done"), 1200);
    } catch (e) { console.error("molecule copy failed", e); }
  });
  container.appendChild(btn);
}

async function renderAll() {
  const containers = document.querySelectorAll(".mol-container[data-smiles]:not([data-rendered])");
  if (containers.length === 0) return;
  containers.forEach((c) => {
    c.setAttribute("data-rendered", "1");
    const p = document.createElement("p");
    p.className = "mol-loading"; p.textContent = "Loading RDKit...";
    c.innerHTML = ""; c.appendChild(p);
  });
  try {
    const rdkit = await loadRDKit();
    containers.forEach((c) => renderMolecule(c, rdkit));
  } catch (e) {
    containers.forEach((c) => { c.innerHTML = '<p class="mol-error">Failed to load RDKit.</p>'; });
  }
}

document.addEventListener("nav", () => { renderAll(); });
`

export const Molecules: QuartzTransformerPlugin = () => {
  return {
    name: "Molecules",
    markdownPlugins() {
      return [
        () => (tree: Root) => {
          visit(tree, "code", (node: any) => {
            const lang = (node.lang ?? "").toLowerCase()
            if (lang !== "smiles" && lang !== "mol") return
            const smiles = escapeAttr((node.value ?? "").trim())
            // replace the code node with a raw html placeholder
            node.type = "html"
            node.value = `<div class="mol-container" data-smiles="${smiles}"></div>`
            delete node.lang
            delete node.meta
          })
        },
      ]
    },
    externalResources() {
      return {
        css: [{ content: css, inline: true }],
        js: [
          {
            script,
            loadTime: "afterDOMReady",
            contentType: "inline",
          },
        ],
      }
    },
  }
}
