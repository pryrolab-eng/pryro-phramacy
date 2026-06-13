import fs from "fs";
import path from "path";

const REPLACEMENTS = [
  [
    /const\s*\{\s*data:\s*\{\s*user\s*\}\s*,\s*error:\s*authError\s*\}\s*=\s*await\s+(\w+)\.auth\.getUser\(\)\s*;?/g,
    "const user = await getAuthUser($1);",
  ],
  [
    /const\s*\{\s*data:\s*\{\s*user\s*\}\s*,\s*error:\s*userError\s*\}\s*=\s*await\s+(\w+)\.auth\.getUser\(\)\s*;?/g,
    "const user = await getAuthUser($1);",
  ],
  [
    /const\s*\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+(\w+)\.auth\.getUser\(\)\s*;?/g,
    "const user = await getAuthUser($1);",
  ],
  [
    /const\s*\{\s*\n\s*data:\s*\{\s*user(?::\s*\w+)?\s*\}\s*,?\s*\n\s*error:\s*\w+\s*,?\s*\n\s*\}\s*=\s*await\s+(\w+)\.auth\.getUser\(\)\s*;?/g,
    "const user = await getAuthUser($1);",
  ],
  [
    /const\s*\{\s*\n\s*data:\s*\{\s*user:\s*(\w+)\s*\}\s*,?\s*\n\s*\}\s*=\s*await\s+(\w+)\.auth\.getUser\(\)\s*;?/g,
    "const $1 = await getAuthUser($2);",
  ],
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(path.resolve("src/app/api"))) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes(".auth.getUser()")) continue;

  const original = content;
  for (const [re, repl] of REPLACEMENTS) {
    content = content.replace(re, repl);
  }
  if (content === original) continue;

  content = content.replace(/if\s*\(\s*authError\s*\|\|\s*!user\s*\)/g, "if (!user)");
  content = content.replace(/if\s*\(\s*userError\s*\|\|\s*!user\s*\)/g, "if (!user)");

  if (!content.includes('from "@/lib/auth/get-auth-user"')) {
    const importMatch = content.match(/^import .+$/m);
    const importLine =
      'import { getAuthUser } from "@/lib/auth/get-auth-user";\n';
    if (importMatch) {
      content = content.replace(importMatch[0], `${importMatch[0]}\n${importLine}`);
    } else {
      content = importLine + content;
    }
  }

  fs.writeFileSync(file, content);
  changed++;
  console.log("updated:", path.relative(process.cwd(), file));
}

console.log(`\nDone. ${changed} file(s) updated.`);
