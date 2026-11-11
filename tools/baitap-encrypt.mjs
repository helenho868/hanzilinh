// Mã hóa các module bài tập tiếng Anh.
// Cách dùng:  node tools/baitap-encrypt.mjs <thư-mục-nguồn> <KEY>
// Thư mục nguồn chứa các file <id>.json và _list.json (không đưa thư mục này lên GitHub).
// Kết quả: data/baitap/manifest.enc và data/baitap/<id>.enc (chỉ file này được commit).
import fs from "fs";
import path from "path";
import {webcrypto as c} from "crypto";
const [src, key] = process.argv.slice(2);
if (!src || !key) { console.error("Dùng: node tools/baitap-encrypt.mjs <thư-mục-nguồn> <KEY>"); process.exit(1); }
const out = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data", "baitap");
const IT = 150000, enc = new TextEncoder();
const b64 = (u) => Buffer.from(u).toString("base64");
async function seal(text) {
  const salt = c.getRandomValues(new Uint8Array(16)), iv = c.getRandomValues(new Uint8Array(12));
  const base = await c.subtle.importKey("raw", enc.encode(key), "PBKDF2", false, ["deriveKey"]);
  const k = await c.subtle.deriveKey({name: "PBKDF2", salt, iterations: IT, hash: "SHA-256"}, base, {name: "AES-GCM", length: 256}, false, ["encrypt"]);
  const ct = await c.subtle.encrypt({name: "AES-GCM", iv}, k, enc.encode(text));
  return JSON.stringify({v: 1, it: IT, s: b64(salt), i: b64(iv), c: b64(new Uint8Array(ct))});
}
const strip = (m) => { for (const s of m.sections) for (const i of s.items) delete i.flag; return m; };
fs.mkdirSync(out, {recursive: true});
for (const f of fs.readdirSync(out)) if (f.endsWith(".enc")) fs.unlinkSync(path.join(out, f));
const list = JSON.parse(fs.readFileSync(path.join(src, "_list.json"), "utf8"));
for (const m of list) {
  const mod = strip(JSON.parse(fs.readFileSync(path.join(src, m.id + ".json"), "utf8")));
  fs.writeFileSync(path.join(out, m.id + ".enc"), await seal(JSON.stringify(mod)));
}
fs.writeFileSync(path.join(out, "manifest.enc"), await seal(JSON.stringify(list)));
console.log("Đã mã hóa", list.length, "module vào", out);
