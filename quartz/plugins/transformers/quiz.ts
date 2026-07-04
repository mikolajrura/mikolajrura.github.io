import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root } from "mdast"

// Interaktywne pytania jednokrotnego wyboru.
// Autor pisze blok ```quiz:
//   Treść pytania:
//   - błędna odpowiedź
//   + poprawna odpowiedź
//   - błędna odpowiedź
// Linie zaczynające się od "+" to odpowiedzi poprawne, od "-"/"*" błędne.
// Wszystko przed pierwszą opcją traktowane jest jako treść pytania.
// Klik = zielone podświetlenie (dobra) lub czerwone + ❌ (zła). Klik ponownie odznacza.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function buildQuiz(raw: string): string {
  const lines = raw.split("\n")
  const question: string[] = []
  const opts: { text: string; correct: boolean }[] = []
  for (const line of lines) {
    const m = line.match(/^\s*([+\-*])\s+(.*)$/)
    if (m) {
      opts.push({ text: m[2].trim(), correct: m[1] === "+" })
    } else if (line.trim() !== "") {
      question.push(line.trim())
    }
  }
  const q = question.length ? `<p class="quiz-q">${escapeHtml(question.join(" "))}</p>` : ""
  const items = opts
    .map(
      (o) =>
        `<li class="quiz-opt"${o.correct ? " data-correct" : ""}>${escapeHtml(o.text)}</li>`,
    )
    .join("")
  return `<div class="quiz">${q}<ol class="quiz-opts">${items}</ol></div>`
}

const css = `
.quiz { margin: 1rem 0; }
.quiz-q { font-weight: 600; margin-bottom: 0.5rem; }
.quiz-opts { list-style: none; counter-reset: opt; padding-left: 0; margin: 0; }
.quiz-opt {
  counter-increment: opt;
  position: relative;
  padding: 0.45rem 2rem 0.45rem 2rem;
  margin: 0.3rem 0;
  border: 1px solid var(--lightgray);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.12s ease, border-color 0.12s ease;
}
.quiz-opt::before {
  content: counter(opt, lower-alpha) ")";
  position: absolute;
  left: 0.65rem;
  font-weight: 600;
  color: var(--gray);
}
.quiz-opt:hover { border-color: var(--secondary); }
.quiz-opt.revealed.correct {
  background-color: rgba(70, 167, 88, 0.22);
  border-color: rgba(70, 167, 88, 0.6);
}
.quiz-opt.revealed.wrong {
  background-color: rgba(220, 76, 70, 0.16);
  border-color: rgba(220, 76, 70, 0.5);
}
.quiz-opt.revealed.wrong::after {
  content: "❌";
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9em;
}
`

const script = `
function initQuiz() {
  document.querySelectorAll(".quiz-opt").forEach((el) => {
    if (el.dataset.quizBound) return;
    el.dataset.quizBound = "1";
    el.addEventListener("click", () => {
      if (el.classList.contains("revealed")) {
        el.classList.remove("revealed", "correct", "wrong");
      } else {
        el.classList.add("revealed");
        el.classList.add(el.hasAttribute("data-correct") ? "correct" : "wrong");
      }
    });
  });
}
document.addEventListener("nav", () => { initQuiz(); });
`

export const Quiz: QuartzTransformerPlugin = () => {
  return {
    name: "Quiz",
    markdownPlugins() {
      return [
        () => (tree: Root) => {
          visit(tree, "code", (node: any) => {
            const lang = (node.lang ?? "").toLowerCase()
            if (lang !== "quiz") return
            node.type = "html"
            node.value = buildQuiz(node.value ?? "")
            delete node.lang
            delete node.meta
          })
        },
      ]
    },
    externalResources() {
      return {
        css: [{ content: css, inline: true }],
        js: [{ script, loadTime: "afterDOMReady", contentType: "inline" }],
      }
    },
  }
}
