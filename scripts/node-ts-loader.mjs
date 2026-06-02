import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (
      error &&
      error.code === "ERR_MODULE_NOT_FOUND" &&
      specifier.endsWith(".js") &&
      context.parentURL?.startsWith("file:")
    ) {
      const candidate = new URL(specifier.replace(/\.js$/, ".ts"), context.parentURL);

      if (existsSync(fileURLToPath(candidate))) {
        return {
          url: candidate.href,
          shortCircuit: true
        };
      }
    }

    throw error;
  }
}
