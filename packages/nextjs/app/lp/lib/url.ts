const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Parse and validate AMM pool address from URL search param.
 * Returns undefined if missing or invalid.
 */
export function parsePoolFromUrl(param: string | null): `0x${string}` | undefined {
  if (!param || typeof param !== "string") return undefined;
  const trimmed = param.trim();
  if (!ETH_ADDRESS_REGEX.test(trimmed)) return undefined;
  return trimmed as `0x${string}`;
}
