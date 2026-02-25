import type { Token } from "@uniswap/sdk-core";
import type { Pool } from "@uniswap/v3-sdk";

/** Slot0 return type: sqrtPriceX96, tick, observationIndex, observationCardinality, observationCardinalityNext, feeProtocol */
export type Slot0Tuple = readonly [bigint, number, number, number, number, number];

/** Minimal position shape for UI (SDK Position has more). */
export type PositionLike = {
  liquidity: { toString: () => string };
  mintAmounts: { amount0: { toString: () => string }; amount1: { toString: () => string } };
  token0PriceLower: { toSignificant: (n: number) => string };
  token0PriceUpper: { toSignificant: (n: number) => string };
  amount0: { toSignificant: (n: number) => string };
  amount1: { toSignificant: (n: number) => string };
};

export type TokenInfo = {
  address: string | undefined;
  name: string | undefined;
  symbol: string | undefined;
  decimals: number | bigint | undefined;
  poolBalance: bigint | undefined;
};

export type PoolDataCardProps = {
  poolAddress: string;
  targetNetwork: { name: string; id: number };
  token0: TokenInfo;
  token1: TokenInfo;
  poolFee: bigint | undefined;
  slot0: Slot0Tuple | undefined;
  liquidityRaw: bigint | undefined;
  fetchedTick: number | null;
  tickSpacing: number;
  pool: Pool | null;
  token0Loading: boolean;
  token1Loading: boolean;
  feeLoading: boolean;
};

export type LiquiditySimulatorCardProps = {
  tickSpacing: number;
  useFetchedPrice: boolean;
  setUseFetchedPrice: (v: boolean) => void;
  slot0Loading: boolean;
  liquidityLoading: boolean;
  fetchedTick: number | null;
  currentTick: number;
  setCurrentTickManual: (v: number) => void;
  tickLower: number;
  setTickLower: (v: number) => void;
  tickUpper: number;
  setTickUpper: (v: number) => void;
  tickLowerAligned: number;
  tickUpperAligned: number;
  inRange: boolean;
  token0: Token | null;
  token1: Token | null;
  calcAmount0Raw: string;
  setCalcAmount0Raw: (v: string) => void;
  calcAmount1Raw: string;
  setCalcAmount1Raw: (v: string) => void;
  positionFromAmount0: PositionLike | null;
  positionFromAmount1: PositionLike | null;
  primaryPosition: PositionLike | null;
  pool: Pool | null;
  mintCalldata: { value: string; calldata: string } | null;
  slippageBips: number;
  setSlippageBips: (v: number) => void;
  walletAddress: string | undefined;
};
