import { useMemo } from "react";
import { getTickSpacing } from "../lib/position";
import type { Slot0Tuple } from "../types";
import { Token } from "@uniswap/sdk-core";
import { useReadContract } from "wagmi";
import { erc20Abi } from "~~/config/abis/erc20";
import uniswapV3PoolArtifact from "~~/config/abis/uniswapV3Pool.json";
import { type UniswapV3ChainConfig, getUniswapV3Config } from "~~/config/uniswapV3";

const uniswapV3PoolAbi = uniswapV3PoolArtifact.abi;

export type UsePoolDataParams = {
  poolAddress: `0x${string}` | undefined;
  chainId: number;
};

export type UsePoolDataResult = {
  chainConfig: UniswapV3ChainConfig | undefined;
  token0Address: `0x${string}` | undefined;
  token1Address: `0x${string}` | undefined;
  token0: Token | null;
  token1: Token | null;
  feeTier: number;
  tickSpacing: number;
  slot0Tuple: Slot0Tuple | undefined;
  fetchedTick: number | null;
  liquidityRaw: bigint | undefined;
  poolFee: bigint | undefined;
  name0: string | undefined;
  symbol0: string | undefined;
  dec0: number | undefined;
  name1: string | undefined;
  symbol1: string | undefined;
  dec1: number | undefined;
  poolBalance0: bigint | undefined;
  poolBalance1: bigint | undefined;
  poolToken0Loading: boolean;
  poolToken1Loading: boolean;
  poolFeeLoading: boolean;
  slot0Loading: boolean;
  liquidityLoading: boolean;
};

export function usePoolData({ poolAddress, chainId }: UsePoolDataParams): UsePoolDataResult {
  const chainConfig = useMemo(() => getUniswapV3Config(chainId), [chainId]);

  const { data: poolToken0, isLoading: poolToken0Loading } = useReadContract({
    address: poolAddress,
    abi: uniswapV3PoolAbi,
    functionName: "token0",
    chainId,
  });
  const { data: poolToken1, isLoading: poolToken1Loading } = useReadContract({
    address: poolAddress,
    abi: uniswapV3PoolAbi,
    functionName: "token1",
    chainId,
  });
  const { data: poolFee, isLoading: poolFeeLoading } = useReadContract({
    address: poolAddress,
    abi: uniswapV3PoolAbi,
    functionName: "fee",
    chainId,
  });
  const { data: slot0, isLoading: slot0Loading } = useReadContract({
    address: poolAddress,
    abi: uniswapV3PoolAbi,
    functionName: "slot0",
    chainId,
  });
  const { data: liquidityRaw, isLoading: liquidityLoading } = useReadContract({
    address: poolAddress,
    abi: uniswapV3PoolAbi,
    functionName: "liquidity",
    chainId,
  });

  const token0Address = typeof poolToken0 === "string" ? (poolToken0 as `0x${string}`) : undefined;
  const token1Address = typeof poolToken1 === "string" ? (poolToken1 as `0x${string}`) : undefined;

  const { data: dec0 } = useReadContract({
    address: token0Address,
    abi: erc20Abi,
    functionName: "decimals",
    chainId,
  });
  const { data: symbol0 } = useReadContract({
    address: token0Address,
    abi: erc20Abi,
    functionName: "symbol",
    chainId,
  });
  const { data: name0 } = useReadContract({
    address: token0Address,
    abi: erc20Abi,
    functionName: "name",
    chainId,
  });
  const { data: dec1 } = useReadContract({
    address: token1Address,
    abi: erc20Abi,
    functionName: "decimals",
    chainId,
  });
  const { data: symbol1 } = useReadContract({
    address: token1Address,
    abi: erc20Abi,
    functionName: "symbol",
    chainId,
  });
  const { data: name1 } = useReadContract({
    address: token1Address,
    abi: erc20Abi,
    functionName: "name",
    chainId,
  });

  const { data: poolBalance0 } = useReadContract({
    address: token0Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: poolAddress ? [poolAddress] : undefined,
    chainId,
  });
  const { data: poolBalance1 } = useReadContract({
    address: token1Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: poolAddress ? [poolAddress] : undefined,
    chainId,
  });

  const token0 = useMemo(() => {
    if (!chainConfig || !token0Address || dec0 == null || !symbol0 || !name0) return null;
    return new Token(chainConfig.chainId, token0Address, Number(dec0), symbol0, name0);
  }, [chainConfig, token0Address, dec0, symbol0, name0]);

  const token1 = useMemo(() => {
    if (!chainConfig || !token1Address || dec1 == null || !symbol1 || !name1) return null;
    return new Token(chainConfig.chainId, token1Address, Number(dec1), symbol1, name1);
  }, [chainConfig, token1Address, dec1, symbol1, name1]);

  const feeTier = poolFee != null ? Number(poolFee) : 3000;
  const tickSpacing = getTickSpacing(feeTier);
  const slot0Tuple = slot0 as Slot0Tuple | undefined;
  const fetchedTick = slot0Tuple != null ? Number(slot0Tuple[1]) : null;

  return {
    chainConfig: chainConfig ?? undefined,
    token0Address,
    token1Address,
    token0: token0 ?? null,
    token1: token1 ?? null,
    feeTier,
    tickSpacing,
    slot0Tuple,
    fetchedTick,
    liquidityRaw: liquidityRaw as bigint | undefined,
    poolFee: poolFee as bigint | undefined,
    name0,
    symbol0,
    dec0: dec0 != null ? Number(dec0) : undefined,
    name1,
    symbol1,
    dec1: dec1 != null ? Number(dec1) : undefined,
    poolBalance0: poolBalance0 as bigint | undefined,
    poolBalance1: poolBalance1 as bigint | undefined,
    poolToken0Loading,
    poolToken1Loading,
    poolFeeLoading,
    slot0Loading,
    liquidityLoading,
  };
}
