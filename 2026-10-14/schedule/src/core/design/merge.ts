import { isLeaf, type DeepPartial } from '../../design/tokens/leaf'

/** Lays `over` on top of `base`, leaf by leaf. Neither argument is changed. */
export function merge<T>(base: T, over: DeepPartial<T> | undefined): T {
  if (!over) return base
  const out = { ...base } as Record<string, unknown>
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) continue
    out[k] = isLeaf(v) ? v : merge(out[k], v as never)
  }
  return out as T
}

/** Every leaf of a (partial) token tree as [dotted path, value]. */
export function leaves(tree: unknown, prefix = ''): [string, unknown][] {
  if (isLeaf(tree)) return [[prefix, tree]]
  return Object.entries(tree as object).flatMap(([k, v]) => (v === undefined ? [] : leaves(v, prefix ? `${prefix}.${k}` : k)))
}

/** The value at a dotted path, or undefined. */
export function at(tree: unknown, path: string): unknown {
  let node = tree
  for (const key of path.split('.')) {
    if (node === null || typeof node !== 'object' || isLeaf(node)) return undefined
    node = (node as Record<string, unknown>)[key]
  }
  return node
}
