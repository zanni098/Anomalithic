import { isAbsolute, relative, resolve } from "node:path";

/** True when `target` resolves to a location inside `root`. */
export function isPathInside(root: string, target: string): boolean {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(resolvedRoot, target);
  const rel = relative(resolvedRoot, resolvedTarget);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/** Throws if `target` escapes `root` (directory-traversal guard). */
export function assertPathInside(root: string, target: string): void {
  if (!isPathInside(root, target)) {
    throw new Error(`Path escapes sandbox root: ${target}`);
  }
}
