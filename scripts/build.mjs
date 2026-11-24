// Copie les fichiers de l'appli web dans www/, le dossier que Capacitor emballe pour iPhone et Android.
import { cpSync, rmSync, mkdirSync } from "node:fs";

const files = ["index.html", "confidentialite.html", "manifest.webmanifest"];
const dirs = ["css", "js", "img", "fonts"];

rmSync("www", { recursive: true, force: true });
mkdirSync("www");
for (const f of files) cpSync(f, `www/${f}`);
for (const d of dirs) cpSync(d, `www/${d}`, { recursive: true });
console.log("www/ prêt");
