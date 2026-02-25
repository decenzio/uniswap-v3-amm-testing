import { useMemo, useState } from "react";
import {
  buildMintCalldata,
  buildPool,
  getTickSpacing,
  humanAmountToRaw,
  positionFromAmount0,
  positionFromAmount1,
} from "../lib/position";
import type { PositionLike } from "../types";
import type { Slot0Tuple } from "../types";
import { Token } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v3-sdk";
import { nearestUsableTick } from "@uniswap/v3-sdk";

export type UseLpSimulatorStateParams = {
  token0: Token | null;
  token1: Token | null;
  feeTier: number;
  slot0Tuple: Slot0Tuple | undefined;
  liquidityRaw: bigint | undefined;
  fetchedTick: number | null;
  slot0Loading: boolean;
  liquidityLoading: boolean;
  walletAddress: string | undefined;
};

export type UseLpSimulatorStateResult = {
  // User state
  currentTickManual: number;
  setCurrentTickManual: (v: number) => void;
  tickLower: number;
  setTickLower: (v: number) => void;
  tickUpper: number;
  setTickUpper: (v: number) => void;
  calcAmount0Raw: string;
  setCalcAmount0Raw: (v: string) => void;
  calcAmount1Raw: string;
  setCalcAmount1Raw: (v: string) => void;
  slippageBips: number;
  setSlippageBips: (v: number) => void;
  useFetchedPrice: boolean;
  setUseFetchedPrice: (v: boolean) => void;
  // Derived
  currentTick: number;
  tickLowerAligned: number;
  tickUpperAligned: number;
  pool: Pool | null;
  positionFromAmount0: PositionLike | null;
  positionFromAmount1: PositionLike | null;
  primaryPosition: PositionLike | null;
  mintCalldata: { value: string; calldata: string } | null;
  inRange: boolean;
  slot0Loading: boolean;
  liquidityLoading: boolean;
};

export function useLpSimulatorState({
  token0,
  token1,
  feeTier,
  slot0Tuple,
  liquidityRaw,
  fetchedTick,
  slot0Loading,
  liquidityLoading,
  walletAddress,
}: UseLpSimulatorStateParams): UseLpSimulatorStateResult {
  const [currentTickManual, setCurrentTickManual] = useState(0);
  const [tickLower, setTickLower] = useState(-100);
  const [tickUpper, setTickUpper] = useState(100);
  const [calcAmount0Raw, setCalcAmount0Raw] = useState("");
  const [calcAmount1Raw, setCalcAmount1Raw] = useState("");
  const [slippageBips, setSlippageBips] = useState(50);
  const [useFetchedPrice, setUseFetchedPrice] = useState(true);

  const tickSpacing = getTickSpacing(feeTier);
  const currentTick = useFetchedPrice && fetchedTick != null ? fetchedTick : currentTickManual;
  const tickLowerAligned = useMemo(() => nearestUsableTick(tickLower, tickSpacing), [tickLower, tickSpacing]);
  const tickUpperAligned = useMemo(() => nearestUsableTick(tickUpper, tickSpacing), [tickUpper, tickSpacing]);

  const pool = useMemo(() => {
    if (!token0 || !token1) return null;
    const useFetched = useFetchedPrice && slot0Tuple != null && liquidityRaw != null && fetchedTick != null;
    return buildPool(
      token0,
      token1,
      feeTier,
      useFetched
        ? { useFetched: true, slot0: slot0Tuple, liquidityRaw, currentTick: fetchedTick }
        : { useFetched: false, currentTick },
    );
  }, [token0, token1, feeTier, slot0Tuple, liquidityRaw, fetchedTick, currentTick, useFetchedPrice]);

  const amount0RawForCalc = useMemo(
    () => (token0 ? humanAmountToRaw(calcAmount0Raw, token0.decimals ?? 18) : null),
    [calcAmount0Raw, token0],
  );
  const amount1RawForCalc = useMemo(
    () => (token1 ? humanAmountToRaw(calcAmount1Raw, token1.decimals ?? 18) : null),
    [calcAmount1Raw, token1],
  );

  const positionFromAmount0Result = useMemo(
    () =>
      pool && amount0RawForCalc
        ? positionFromAmount0(pool, tickLowerAligned, tickUpperAligned, amount0RawForCalc)
        : null,
    [pool, tickLowerAligned, tickUpperAligned, amount0RawForCalc],
  );
  const positionFromAmount1Result = useMemo(
    () =>
      pool && amount1RawForCalc
        ? positionFromAmount1(pool, tickLowerAligned, tickUpperAligned, amount1RawForCalc)
        : null,
    [pool, tickLowerAligned, tickUpperAligned, amount1RawForCalc],
  );

  const primaryPosition = positionFromAmount0Result ?? positionFromAmount1Result;

  const mintCalldata = useMemo(() => {
    if (!primaryPosition || !walletAddress) return null;
    return buildMintCalldata(primaryPosition, walletAddress, slippageBips);
  }, [primaryPosition, walletAddress, slippageBips]);

  const inRange = pool != null ? currentTick >= tickLowerAligned && currentTick < tickUpperAligned : false;

  return {
    currentTickManual,
    setCurrentTickManual,
    tickLower,
    setTickLower,
    tickUpper,
    setTickUpper,
    calcAmount0Raw,
    setCalcAmount0Raw,
    calcAmount1Raw,
    setCalcAmount1Raw,
    slippageBips,
    setSlippageBips,
    useFetchedPrice,
    setUseFetchedPrice,
    currentTick,
    tickLowerAligned,
    tickUpperAligned,
    pool,
    positionFromAmount0: positionFromAmount0Result,
    positionFromAmount1: positionFromAmount1Result,
    primaryPosition,
    mintCalldata,
    inRange,
    slot0Loading,
    liquidityLoading,
  };
}
