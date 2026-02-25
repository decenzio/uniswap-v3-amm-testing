import type { Slot0Tuple } from "../types";
import { Percent, Token } from "@uniswap/sdk-core";
import { NonfungiblePositionManager, Pool, Position, TICK_SPACINGS, TickMath } from "@uniswap/v3-sdk";
import JSBI from "jsbi";

/**
 * Convert human-readable token amount (e.g. "1.5") to raw wei/smallest unit.
 * Returns null if invalid or zero.
 */
export function humanAmountToRaw(amountStr: string, decimals: number): string | null {
  const num = parseFloat(amountStr || "0");
  if (!Number.isFinite(num) || num <= 0) return null;
  const raw = Math.floor(num * 10 ** decimals);
  return raw > 0 ? raw.toString() : null;
}

/**
 * Build Uniswap V3 Pool from slot0 + liquidity when using live data,
 * or from current tick only (zero liquidity) for manual tick.
 */
export function buildPool(
  token0: Token,
  token1: Token,
  feeTier: number,
  opts:
    | { useFetched: true; slot0: Slot0Tuple; liquidityRaw: bigint; currentTick: number }
    | { useFetched: false; currentTick: number },
): Pool {
  if (opts.useFetched && "slot0" in opts) {
    const sqrtRatioX96 = JSBI.BigInt(opts.slot0[0].toString());
    const liquidity = JSBI.BigInt(opts.liquidityRaw.toString());
    return new Pool(token0, token1, feeTier, sqrtRatioX96, liquidity, opts.currentTick);
  }
  const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(opts.currentTick);
  return new Pool(token0, token1, feeTier, sqrtRatioX96, JSBI.BigInt(0), opts.currentTick);
}

export function getTickSpacing(feeTier: number): number {
  return TICK_SPACINGS[feeTier as keyof typeof TICK_SPACINGS] ?? 60;
}

/**
 * Compute position from "I want to add this much token0".
 */
export function positionFromAmount0(
  pool: Pool,
  tickLower: number,
  tickUpper: number,
  amount0Raw: string,
): Position | null {
  if (tickLower >= tickUpper) return null;
  try {
    return Position.fromAmount0({
      pool,
      tickLower,
      tickUpper,
      amount0: JSBI.BigInt(amount0Raw),
      useFullPrecision: true,
    });
  } catch {
    return null;
  }
}

/**
 * Compute position from "I want to add this much token1".
 */
export function positionFromAmount1(
  pool: Pool,
  tickLower: number,
  tickUpper: number,
  amount1Raw: string,
): Position | null {
  if (tickLower >= tickUpper) return null;
  try {
    return Position.fromAmount1({
      pool,
      tickLower,
      tickUpper,
      amount1: JSBI.BigInt(amount1Raw),
    });
  } catch {
    return null;
  }
}

/**
 * Build mint calldata for NonfungiblePositionManager.addCallParameters.
 */
export function buildMintCalldata(
  position: Position,
  recipient: string,
  slippageBips: number,
): { value: string; calldata: string } | null {
  try {
    return NonfungiblePositionManager.addCallParameters(position, {
      recipient,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(slippageBips, 10_000),
    });
  } catch {
    return null;
  }
}

export function formatTokenAmount(raw: string, decimals: number): string {
  return (Number(raw) / 10 ** decimals).toLocaleString(undefined, {
    maximumFractionDigits: 8,
    minimumFractionDigits: 0,
  });
}
