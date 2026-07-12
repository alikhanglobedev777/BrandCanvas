import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const tracked = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

for (const file of tracked) {
  const absolute = path.join(root, file);
  if (!existsSync(absolute)) continue;

  const normalized = file.replaceAll("\\", "/");
  const base = path.posix.basename(normalized);

  if (
    (base === ".env" || base.startsWith(".env.")) &&
    base !== ".env.example"
  ) {
    failures.push(`Tracked environment file is forbidden: ${file}`);
  }

  const content = readFileSync(absolute, "utf8");
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) {
    failures.push(`Private key material detected in tracked file: ${file}`);
  }
}

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const absolute = path.join(directory, entry);
    const info = statSync(absolute);
    if (info.isDirectory()) {
      walk(absolute);
      continue;
    }

    const relative = path.relative(root, absolute).replaceAll("\\", "/");
    if (/\.(?:css|scss|sass|less)$/.test(entry)) {
      failures.push(`Plain stylesheet is forbidden in the web source: ${relative}`);
    }
    if (/\.[jt]sx?$/.test(entry)) {
      const content = readFileSync(absolute, "utf8");
      if (/from\s+["'](?:axios|tailwindcss|@\/components\/ui)/.test(content)) {
        failures.push(`Unapproved frontend dependency/import in: ${relative}`);
      }
      if (relative.includes("/features/") && /\bfetch\s*\(/.test(content)) {
        failures.push(`Feature code must use generated contracts, not fetch(): ${relative}`);
      }
    }
  }
}

walk(path.join(root, "apps", "web", "src"));

if (failures.length) {
  console.error("BrandCanvas repository rule check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("BrandCanvas repository rules passed.");
