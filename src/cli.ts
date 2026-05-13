import * as p from "@clack/prompts";
import { downloadTemplate } from "giget";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
) as { version: string };

const TEMPLATE_REPO =
  process.env.BREASE_TEMPLATE_REPO ??
  "github:designatives/brease-next-templates";

type PM = "npm" | "pnpm" | "yarn" | "bun";

function detectPM(): PM {
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("bun")) return "bun";
  return "npm";
}

function devCommand(pm: PM): string {
  return pm === "npm" ? "npm run dev" : `${pm} dev`;
}

async function main() {
  console.clear();
  p.intro(`brease-next v${pkg.version}`);

  const answers = await p.group(
    {
      name: () =>
        p.text({
          message: "Project name",
          placeholder: "my-brease-app",
          defaultValue: "my-brease-app",
          validate: (value) => {
            const name = value || "my-brease-app";
            if (!/^[a-z0-9-_]+$/i.test(name)) {
              return "Use letters, numbers, hyphens, or underscores only.";
            }
            if (existsSync(resolve(process.cwd(), name))) {
              return `Directory "${name}" already exists.`;
            }
          },
        }),
      template: () =>
        p.select({
          message: "Template",
          initialValue: "starter",
          options: [
            {
              value: "starter",
              label: "Starter",
              hint: 'Opinionated full starter — requires a Brease project created from the "Brease Starter Template"',
            },
            {
              value: "base",
              label: "Base",
              hint: "Bare CMS wiring — slug routing only, bring your own design",
            },
          ],
        }),
      token: () =>
        p.password({
          message: "Brease API token (BREASE_TOKEN)",
          validate: (value) => (value ? undefined : "Token is required."),
        }),
      env: () =>
        p.text({
          message: "Brease environment ID (BREASE_ENV)",
          validate: (value) =>
            value ? undefined : "Environment ID is required.",
        }),
      defaultLocale: () =>
        p.text({
          message: "Default locale (BREASE_DEFAULT_LOCALE)",
          placeholder: "en",
          defaultValue: "en",
          validate: (value) => {
            const v = value || "en";
            if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(v)) {
              return 'Use a locale code like "en" or "en-US".';
            }
          },
        }),
      install: () =>
        p.confirm({
          message: "Install dependencies now?",
          initialValue: true,
        }),
      git: () =>
        p.confirm({
          message: "Initialize a git repository?",
          initialValue: true,
        }),
    },
    {
      onCancel: () => {
        p.cancel("Setup cancelled.");
        process.exit(0);
      },
    },
  );

  const targetDir = resolve(process.cwd(), answers.name);
  const pm = detectPM();

  const templatePath = `${TEMPLATE_REPO}/${answers.template}`;
  const fetchSpinner = p.spinner();
  fetchSpinner.start(`Fetching ${answers.template} template`);
  try {
    await downloadTemplate(`${templatePath}#v${pkg.version}`, {
      dir: targetDir,
    });
  } catch {
    await downloadTemplate(`${templatePath}#main`, { dir: targetDir });
  }
  fetchSpinner.stop("Template fetched.");

  const envContent =
    [
      `BREASE_TOKEN=${answers.token}`,
      `BREASE_ENV=${answers.env}`,
      `BREASE_DEFAULT_LOCALE=${answers.defaultLocale}`,
    ].join("\n") + "\n";
  writeFileSync(join(targetDir, ".env.local"), envContent);

  if (answers.git) {
    const s = p.spinner();
    s.start("Initializing git");
    try {
      execSync("git init", { cwd: targetDir, stdio: "ignore" });
      s.stop("Git initialized.");
    } catch {
      s.stop("Skipped git (is it installed?).");
    }
  }

  if (answers.install) {
    const s = p.spinner();
    s.start(`Installing dependencies with ${pm}`);
    try {
      execSync(`${pm} install`, { cwd: targetDir, stdio: "ignore" });
      s.stop("Dependencies installed.");
    } catch {
      s.stop("Failed to install dependencies.");
      p.log.warn(`Run \`${pm} install\` manually inside ${answers.name}.`);
    }
  }

  p.outro(`Done! Next steps:\n  cd ${answers.name}\n  ${devCommand(pm)}`);
}

main().catch((err) => {
  p.cancel("Something went wrong.");
  console.error(err);
  process.exit(1);
});
