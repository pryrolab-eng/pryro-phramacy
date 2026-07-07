/**
 * Writes demo Excel files to public/demo/ for import-flow testing.
 *
 *   npx tsx scripts/generate-demo-import-files.ts
 */
import path from "node:path";
import { writeDemoImportFiles } from "@/lib/seed/write-demo-import-files";

async function main() {
  const outputDir = path.join(process.cwd(), "public", "demo");
  const written = await writeDemoImportFiles(outputDir);
  console.log(`Wrote ${written.length} files to ${outputDir}:`);
  for (const file of written) {
    console.log(`  - ${path.basename(file)}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
