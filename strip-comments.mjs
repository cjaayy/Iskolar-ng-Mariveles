import fs from "fs";
import path from "path";

const BASE = path.join(process.cwd(), "frontend", "src", "app");

const FILES = [
  "page.tsx",
  "not-found.tsx",
  "error.tsx",
  "globals.css",
  "(app)/dashboard/page.tsx",
  "(app)/basic-info/page.tsx",
  "(app)/profile/page.tsx",
  "(app)/requirements/page.tsx",
  "register/[token]/page.tsx",
  "admin/dashboard/page.tsx",
  "admin/applicants/page.tsx",
  "admin/applicants/[id]/page.tsx",
  "admin/approved/page.tsx",
  "admin/barangay-access/page.tsx",
  "admin/barangay-requirements/page.tsx",
  "admin/invites/page.tsx",
  "admin/registered/page.tsx",
  "admin/registered/[id]/page.tsx",
  "admin/validate/page.tsx",
  "admin/validate/[id]/page.tsx",
  "admin/validators/page.tsx",
  "staff/dashboard/page.tsx",
  "staff/barangays/page.tsx",
  "staff/validate/page.tsx",
  "staff/validate/[id]/page.tsx",
];

function stripComments(src, isCSS) {
  let result = "";
  let i = 0;
  const len = src.length;

  while (i < len) {
    // Handle template literals
    if (src[i] === "`") {
      result += src[i++];
      while (i < len && src[i] !== "`") {
        if (src[i] === "\\") {
          result += src[i++];
          if (i < len) result += src[i++];
        } else if (src[i] === "$" && i + 1 < len && src[i + 1] === "{") {
          // Template expression - need to handle nested braces
          result += src[i++]; // $
          result += src[i++]; // {
          let depth = 1;
          while (i < len && depth > 0) {
            if (src[i] === "{") depth++;
            else if (src[i] === "}") depth--;
            if (depth > 0) {
              result += src[i++];
            }
          }
          if (i < len) result += src[i++]; // closing }
        } else {
          result += src[i++];
        }
      }
      if (i < len) result += src[i++]; // closing `
      continue;
    }

    // Handle double-quoted strings
    if (src[i] === '"') {
      result += src[i++];
      while (i < len && src[i] !== '"') {
        if (src[i] === "\\") {
          result += src[i++];
          if (i < len) result += src[i++];
        } else {
          result += src[i++];
        }
      }
      if (i < len) result += src[i++]; // closing "
      continue;
    }

    // Handle single-quoted strings
    if (src[i] === "'") {
      result += src[i++];
      while (i < len && src[i] !== "'") {
        if (src[i] === "\\") {
          result += src[i++];
          if (i < len) result += src[i++];
        } else {
          result += src[i++];
        }
      }
      if (i < len) result += src[i++]; // closing '
      continue;
    }

    // Handle block comments /* ... */
    if (src[i] === "/" && i + 1 < len && src[i + 1] === "*") {
      // Skip the entire block comment
      i += 2;
      while (
        i < len &&
        !(src[i] === "*" && i + 1 < len && src[i + 1] === "/")
      ) {
        i++;
      }
      if (i < len) i += 2; // skip */
      continue;
    }

    // Handle single-line comments // (but not URLs like https://)
    if (!isCSS && src[i] === "/" && i + 1 < len && src[i + 1] === "/") {
      // Check if this is part of a URL (preceded by : like http:// or https://)
      if (i > 0 && src[i - 1] === ":") {
        result += src[i++];
        continue;
      }
      // Skip to end of line
      while (i < len && src[i] !== "\n") {
        i++;
      }
      continue;
    }

    // Handle regex literals (to avoid false positives with / character)
    // Simple heuristic: if / follows certain tokens, it's likely a regex
    if (!isCSS && src[i] === "/") {
      // Look back to see if this could be a regex
      const before = result.trimEnd();
      const lastChar = before.length > 0 ? before[before.length - 1] : "";
      const regexPreceders = [
        "=",
        "(",
        "[",
        "!",
        "&",
        "|",
        "?",
        ":",
        ",",
        ";",
        "{",
        "}",
        "\n",
        "^",
        "~",
        "+",
        "-",
        "*",
        "%",
        "<",
        ">",
      ];

      if (
        regexPreceders.includes(lastChar) ||
        before.endsWith("return") ||
        before.endsWith("typeof") ||
        before.endsWith("void") ||
        before.endsWith("delete") ||
        before.endsWith("throw") ||
        before.endsWith("case") ||
        before.endsWith("in") ||
        before.endsWith("instanceof")
      ) {
        // Likely a regex
        result += src[i++]; // opening /
        while (i < len && src[i] !== "/" && src[i] !== "\n") {
          if (src[i] === "\\" && i + 1 < len) {
            result += src[i++];
            result += src[i++];
          } else if (src[i] === "[") {
            result += src[i++];
            while (i < len && src[i] !== "]" && src[i] !== "\n") {
              if (src[i] === "\\" && i + 1 < len) {
                result += src[i++];
              }
              result += src[i++];
            }
            if (i < len && src[i] === "]") result += src[i++];
          } else {
            result += src[i++];
          }
        }
        if (i < len && src[i] === "/") {
          result += src[i++]; // closing /
          // Flags
          while (i < len && /[gimsuy]/.test(src[i])) {
            result += src[i++];
          }
        }
        continue;
      }
    }

    result += src[i++];
  }

  return result;
}

function collapseBlankLines(text) {
  // Remove lines that are only whitespace if they create more than 1 consecutive blank line
  const lines = text.split("\n");
  const out = [];
  let blankCount = 0;

  for (const line of lines) {
    if (line.trim() === "") {
      blankCount++;
      if (blankCount <= 1) {
        out.push(line);
      }
    } else {
      blankCount = 0;
      out.push(line);
    }
  }

  // Remove trailing blank lines, keep one final newline
  while (out.length > 0 && out[out.length - 1].trim() === "") {
    out.pop();
  }
  out.push(""); // ensure file ends with newline

  return out.join("\n");
}

function trimTrailingWhitespace(text) {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

let processed = 0;
let skipped = 0;

for (const rel of FILES) {
  const full = path.join(BASE, rel);
  if (!fs.existsSync(full)) {
    console.log(`SKIP (not found): ${rel}`);
    skipped++;
    continue;
  }

  const original = fs.readFileSync(full, "utf-8");
  const isCSS = rel.endsWith(".css");

  let cleaned = stripComments(original, isCSS);
  cleaned = trimTrailingWhitespace(cleaned);
  cleaned = collapseBlankLines(cleaned);

  if (cleaned !== original) {
    fs.writeFileSync(full, cleaned, "utf-8");
    const origLines = original.split("\n").length;
    const newLines = cleaned.split("\n").length;
    console.log(
      `DONE: ${rel} (${origLines} -> ${newLines} lines, removed ${origLines - newLines})`,
    );
    processed++;
  } else {
    console.log(`UNCHANGED: ${rel}`);
    skipped++;
  }
}

console.log(
  `\nFinished: ${processed} files modified, ${skipped} unchanged/skipped.`,
);
