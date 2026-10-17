// Bundles Firebase into two plain script files that need no internet to load:
//   ../study-sync.js   used by the app (email sign-in and cloud sync)
//   ../auth-helper.js  used by auth.html (Google sign-in page, served by GitHub Pages)
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const common = {
  bundle: true,
  format: "iife",
  minify: true,
  target: ["chrome100"],
  legalComments: "none",
  logLevel: "info",
};

await build({ ...common, entryPoints: [path.join(here, "entry.js")], outfile: path.join(here, "..", "study-sync.js") });
await build({ ...common, entryPoints: [path.join(here, "helper-entry.js")], outfile: path.join(here, "..", "auth-helper.js") });
