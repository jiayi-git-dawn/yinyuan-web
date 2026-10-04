import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const output = join(root, "dist");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const [sourceHtml, styles, config, waterScene, app] = await Promise.all([
  readFile(join(root, "index.html"), "utf8"),
  readFile(join(root, "styles.css"), "utf8"),
  readFile(join(root, "config.js"), "utf8"),
  readFile(join(root, "water-scene.js"), "utf8"),
  readFile(join(root, "app.js"), "utf8"),
]);

// This is a single-page experience. Inlining the small code files avoids two
// extra CDN round trips before the first garden image can even start loading.
const html = sourceHtml
  .replace(
    /<link rel="stylesheet" href="\.\/styles\.css[^"]*" \/>/,
    `<style>\n${styles}\n</style>`,
  )
  .replace(
    /<script src="\.\/config\.js[^"]*"><\/script>/,
    `<script>\n${config}\n</script>`,
  )
  .replace(
    /<script src="\.\/water-scene\.js[^"]*" defer><\/script>/,
    `<script>\n${waterScene}\n</script>`,
  )
  .replace(
    /<script src="\.\/app\.js[^"]*" defer><\/script>/,
    `<script>\n${app}\n</script>`,
  );

await writeFile(join(output, "index.html"), html, "utf8");

// Publish only assets that the built page can request. Source experiments and
// unused 3D models remain available locally without inflating the live bundle.
const referencedAssets = new Set(
  [...html.matchAll(/(?:\.\/)?assets\/([A-Za-z0-9_./-]+)/g)].map((match) => match[1]),
);

for (const asset of referencedAssets) {
  const source = join(root, "assets", asset);
  const destination = join(output, "assets", asset);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

console.log(`Static site ready in dist/ with ${referencedAssets.size} referenced assets.`);
