import fs from "fs";
import path from "path";

const ROOT = path.resolve("src");
const SKIP = new Set(
  [
    "src/lib/auth/admin-users.ts",
    "src/lib/auth/get-auth-user.ts",
    "src/lib/db/staff-store.ts",
    "src/lib/staff/staff-invite-email.ts",
    "src/app/api/auth/complete-2fa/route.ts",
    "src/app/actions.ts",
    "src/components/reset-password-form.tsx",
    "src/components/navbar.tsx",
    "src/components/sidebar/use-sidebar-user-name.ts",
    "src/app/auth/callback/route.ts",
  ].map((p) => path.normalize(p)),
);

const REPLACEMENTS = [
  [
    /const\s*\{\s*data:\s*\{\s*user\s*\}\s*,\s*error:\s*authError\s*\}\s*=\s*await\s+(\w+)\.auth\.getUser\(\)\s*;?/g,
    "const user = await getAuthUser($1)",
  ],
  [
    /const\s*\{\s*data:\s*\{\s*user\s*\}\s*,\s*error:\s*userError\s*\}\s*=\s*await\s+(\w+)\.auth\.getUser\(\)\s*;?/g,
    "const user = await getAuthUser($1)",
  ],
  [
    /const\s*\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+(\w+)\.auth\.getUser\(\)\s*;?/g,
    "const user = await getAuthUser($1)",
  ],
  [
    /const\s*\{\s*\n\s*data:\s*\{\s*user\s*\},?\s*\n\s*\}\s*=\s*await\s+(\w+)\.auth\.getUser\(\)\s*;?/g,
    "const user = await getAuthUser($1)",
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

function migrate(content) {
  if (!content.includes(".auth.getUser()")) return null;

  let next = content;
  let changed = false;
  for (const [re, repl] of REPLACEMENTS) {
    const updated = next.replace(re, repl);
    if (updated !== next) {
      changed = true;
      next = updated;
    }
  }
  if (!changed) return null;

  next = next.replace(/if\s*\(\s*authError\s*\|\|\s*!user\s*\)/g, "if (!user)");
  next = next.replace(/if\s*\(\s*!user\s*\|\|\s*authError\s*\)/g, "if (!user)");
  next = next.replace(/if\s*\(\s*userError\s*\|\|\s*!user\s*\)/g, "if (!user)");
  next = next.replace(/if\s*\(\s*!user\s*\|\|\s*userError\s*\)/g, "if (!user)");

  if (!next.includes('from "@/lib/auth/get-auth-user"')) {
    const importMatch = next.match(/^import .+$/m);
    const importLine =
      'import { getAuthUser } from "@/lib/auth/get-auth-user";\n';
    if (importMatch) {
      next = next.replace(importMatch[0], `${importMatch[0]}\n${importLine}`);
    } else {
      next = importLine + next;
    }
  }

  return next;
}

let changed = 0;
let remaining = [];
for (const file of walk(ROOT)) {
  const norm = path.normalize(file);
  if (SKIP.has(norm)) continue;
  const raw = fs.readFileSync(file, "utf8");
  const updated = migrate(raw);
  if (updated) {
    fs.writeFileSync(file, updated);
    changed++;
    console.log("updated:", path.relative(process.cwd(), file));
  } else if (raw.includes(".auth.getUser()")) {
    remaining.push(path.relative(process.cwd(), file));
  }
}
console.log(`\nDone. ${changed} file(s) updated.`);
if (remaining.length) {
  console.log(`\nManual review (${remaining.length}):`);
  remaining.forEach((f) => console.log(" -", f));
}
