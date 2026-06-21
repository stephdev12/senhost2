import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Base paths — relative to project root
const PROJECT_ROOT = process.cwd();
const TEMPLATES_DIR = path.join(PROJECT_ROOT, "templates");
const INSTANCES_DIR = path.join(PROJECT_ROOT, "instances");

/**
 * Ensure base directories exist
 */
export function ensureDirectories() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
  if (!fs.existsSync(INSTANCES_DIR)) {
    fs.mkdirSync(INSTANCES_DIR, { recursive: true });
  }
}

/**
 * List available templates
 */
export function listTemplates(): {
  id: string;
  name: string;
  description: string;
  hasNodeModules: boolean;
}[] {
  ensureDirectories();
  
  if (!fs.existsSync(TEMPLATES_DIR)) return [];

  const dirs = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true });
  return dirs
    .filter((d) => d.isDirectory())
    .map((d) => {
      const templatePath = path.join(TEMPLATES_DIR, d.name);
      const packageJsonPath = path.join(templatePath, "package.json");
      let name = d.name;
      let description = "";

      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf-8")
          );
          name = pkg.name || d.name;
          description = pkg.description || "";
        } catch {
          // ignore parse errors
        }
      }

      return {
        id: d.name,
        name,
        description,
        hasNodeModules: fs.existsSync(
          path.join(templatePath, "node_modules")
        ),
      };
    });
}

/**
 * Copy a template to create a new instance
 */
export function copyTemplate(
  templateId: string,
  instanceId: string,
  config: Record<string, string> = {}
): { success: boolean; error?: string; instancePath?: string } {
  ensureDirectories();

  const templatePath = path.join(TEMPLATES_DIR, templateId);
  const instancePath = path.join(INSTANCES_DIR, instanceId);

  // Check template exists
  if (!fs.existsSync(templatePath)) {
    return { success: false, error: `Template "${templateId}" not found` };
  }

  // Check instance doesn't already exist
  if (fs.existsSync(instancePath)) {
    return { success: false, error: `Instance "${instanceId}" already exists` };
  }

  try {
    // Copy template files (excluding node_modules)
    copyDirSync(templatePath, instancePath, ["node_modules"]);

    // Create symlink to template's node_modules
    const templateNodeModules = path.join(templatePath, "node_modules");
    const instanceNodeModules = path.join(instancePath, "node_modules");

    if (fs.existsSync(templateNodeModules)) {
      fs.symlinkSync(templateNodeModules, instanceNodeModules, "dir");
    }

    // Write user configuration
    if (Object.keys(config).length > 0) {
      const configPath = path.join(instancePath, "config.json");
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Also create .env if config contains env-like keys
      const envContent = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
      fs.writeFileSync(path.join(instancePath, ".env"), envContent);
    }

    return { success: true, instancePath };
  } catch (error: any) {
    // Cleanup on failure
    if (fs.existsSync(instancePath)) {
      fs.rmSync(instancePath, { recursive: true, force: true });
    }
    return { success: false, error: error.message };
  }
}

/**
 * Delete an instance directory
 */
export function deleteInstance(instanceId: string): {
  success: boolean;
  error?: string;
} {
  const instancePath = path.join(INSTANCES_DIR, instanceId);

  if (!fs.existsSync(instancePath)) {
    return { success: false, error: `Instance "${instanceId}" not found` };
  }

  let attempts = 5;
  let lastError = null;

  while (attempts > 0) {
    try {
      fs.rmSync(instancePath, { recursive: true, force: true });
      return { success: true };
    } catch (error: any) {
      lastError = error;
      attempts--;
      if (attempts > 0) {
        try {
          // Wait 150ms for PM2 to finish terminating the process and releasing files
          execSync("sleep 0.15");
        } catch (_) {}
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || `Failed to delete instance directory "${instanceId}"`,
  };
}

/**
 * List all instances
 */
export function listInstances(): {
  id: string;
  templateId: string;
  config: Record<string, string>;
  createdAt: Date;
}[] {
  ensureDirectories();
  
  if (!fs.existsSync(INSTANCES_DIR)) return [];

  const dirs = fs.readdirSync(INSTANCES_DIR, { withFileTypes: true });
  return dirs
    .filter((d) => d.isDirectory())
    .map((d) => {
      const instancePath = path.join(INSTANCES_DIR, d.name);
      const configPath = path.join(instancePath, "config.json");
      let config: Record<string, string> = {};
      let templateId = "";

      if (fs.existsSync(configPath)) {
        try {
          config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        } catch {
          // ignore
        }
      }

      // Try to determine template from symlink
      const nodeModulesPath = path.join(instancePath, "node_modules");
      if (
        fs.existsSync(nodeModulesPath) &&
        fs.lstatSync(nodeModulesPath).isSymbolicLink()
      ) {
        const target = fs.readlinkSync(nodeModulesPath);
        templateId = path.basename(path.dirname(target));
      }

      const stats = fs.statSync(instancePath);

      return {
        id: d.name,
        templateId,
        config,
        createdAt: stats.birthtime,
      };
    });
}

/**
 * Get the entry point script for an instance
 */
export function getInstanceEntryPoint(instanceId: string): string | null {
  const instancePath = path.join(INSTANCES_DIR, instanceId);
  
  // Check for common entry points
  const candidates = ["index.js", "bot.js", "main.js", "app.js", "src/index.js"];
  
  for (const candidate of candidates) {
    const fullPath = path.join(instancePath, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Check package.json main field
  const packageJsonPath = path.join(instancePath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      if (pkg.main) {
        const mainPath = path.join(instancePath, pkg.main);
        if (fs.existsSync(mainPath)) return mainPath;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Recursively copy a directory, excluding specified directories
 */
function copyDirSync(src: string, dest: string, exclude: string[] = []) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
