"use client";

/**
 * LP Simulator page — Uniswap V3 concentrated liquidity.
 *
 * Flow:
 * 1. Pool address comes from URL (?ammPool=0x...). Chain config from config/uniswapV3.
 * 2. We read pool contract (token0, token1, fee, slot0, liquidity) and token metadata + pool balances.
 * 3. User sets tick range and one token amount; we compute the other amount and mint calldata.
 */
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Percent, Token } from "@uniswap/sdk-core";
import {
  NonfungiblePositionManager,
  Pool,
  Position,
  TICK_SPACINGS,
  TickMath,
  nearestUsableTick,
} from "@uniswap/v3-sdk";
import JSBI from "jsbi";
import type { NextPage } from "next";
import { useAccount, useReadContract } from "wagmi";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { erc20Abi } from "~~/config/abis/erc20";
import uniswapV3PoolArtifact from "~~/config/abis/uniswapV3Pool.json";
import { getUniswapV3Config } from "~~/config/uniswapV3";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const uniswapV3PoolAbi = uniswapV3PoolArtifact.abi;

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function parsePoolFromUrl(param: string | null): `0x${string}` | undefined {
  if (!param || typeof param !== "string") return undefined;
  const trimmed = param.trim();
  if (!ETH_ADDRESS_REGEX.test(trimmed)) return undefined;
  return trimmed as `0x${string}`;
}

// -----------------------------------------------------------------------------
// Early-exit views (no pool or unsupported chain)
// -----------------------------------------------------------------------------

function BackLink() {
  return (
    <Link href="/" className="link link-hover flex items-center gap-1 text-sm mb-6">
      <ArrowLeftIcon className="w-4 h-4" />
      Back
    </Link>
  );
}

function UnsupportedChainView({ networkName, chainId }: { networkName: string; chainId: number }) {
  return (
    <div className="flex items-center flex-col grow pt-6 px-4">
      <div className="w-full max-w-2xl min-w-0">
        <BackLink />
        <div className="alert alert-warning">
          <span>
            Uniswap V3 is not configured for <strong>{networkName}</strong> (chain id {chainId}). Switch to Sepolia to
            use the LP simulator.
          </span>
        </div>
      </div>
    </div>
  );
}

function MissingPoolParamView() {
  return (
    <div className="flex items-center flex-col grow pt-6 px-4">
      <div className="w-full max-w-2xl min-w-0">
        <BackLink />
        <h1 className="text-3xl font-bold mb-2">Uniswap V3 LP Simulator</h1>
        <p className="text-base-content/80">
          The AMM pool address must be provided (URL parameter <code className="bg-base-200 px-1 rounded">ammPool</code>
          ). Example:{" "}
          <Link href="/lp?ammPool=0xB7f0fbE6eaC7C096c1665546b747B65fE6277381" className="link">
            /lp?ammPool=0xB7f0fbE6eaC7C096c1665546b747B65fE6277381
          </Link>
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main page component (wrapped in Suspense for useSearchParams)
// -----------------------------------------------------------------------------

const LpSimulatorPage: NextPage = () => {
  return (
    <Suspense fallback={<LpPageFallback />}>
      <LpSimulatorContent />
    </Suspense>
  );
};

function LpPageFallback() {
  return (
    <div className="flex items-center flex-col grow pt-6 px-4">
      <div className="w-full max-w-2xl min-w-0">
        <BackLink />
        <p className="text-base-content/70">Loading…</p>
      </div>
    </div>
  );
}

function LpSimulatorContent() {
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const searchParams = useSearchParams();

  // ----- URL & config -----
  const chainConfig = useMemo(() => getUniswapV3Config(targetNetwork.id), [targetNetwork.id]);
  const poolAddress = useMemo(() => parsePoolFromUrl(searchParams.get("ammPool")), [searchParams]);

  // ----- Pool contract reads (token0, token1, fee, slot0, liquidity) -----
  const { data: poolToken0, isLoading: poolToken0Loading } = useReadContract({
    address: poolAddress,
    abi: uniswapV3PoolAbi,
    functionName: "token0",
    chainId: targetNetwork.id,
  });
  const { data: poolToken1, isLoading: poolToken1Loading } = useReadContract({
    address: poolAddress,
    abi: uniswapV3PoolAbi,
    functionName: "token1",
    chainId: targetNetwork.id,
  });
  const { data: poolFee, isLoading: poolFeeLoading } = useReadContract({
    address: poolAddress,
    abi: uniswapV3PoolAbi,
    functionName: "fee",
    chainId: targetNetwork.id,
  });
  const { data: slot0, isLoading: slot0Loading } = useReadContract({
    address: poolAddress,
    abi: uniswapV3PoolAbi,
    functionName: "slot0",
    chainId: targetNetwork.id,
  });
  const { data: liquidityRaw, isLoading: liquidityLoading } = useReadContract({
    address: poolAddress,
    abi: uniswapV3PoolAbi,
    functionName: "liquidity",
    chainId: targetNetwork.id,
  });

  const token0Address = typeof poolToken0 === "string" ? (poolToken0 as `0x${string}`) : undefined;
  const token1Address = typeof poolToken1 === "string" ? (poolToken1 as `0x${string}`) : undefined;

  // ----- Token metadata (decimals, symbol, name) -----
  const { data: dec0 } = useReadContract({
    address: token0Address,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: targetNetwork.id,
  });
  const { data: symbol0 } = useReadContract({
    address: token0Address,
    abi: erc20Abi,
    functionName: "symbol",
    chainId: targetNetwork.id,
  });
  const { data: name0 } = useReadContract({
    address: token0Address,
    abi: erc20Abi,
    functionName: "name",
    chainId: targetNetwork.id,
  });
  const { data: dec1 } = useReadContract({
    address: token1Address,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: targetNetwork.id,
  });
  const { data: symbol1 } = useReadContract({
    address: token1Address,
    abi: erc20Abi,
    functionName: "symbol",
    chainId: targetNetwork.id,
  });
  const { data: name1 } = useReadContract({
    address: token1Address,
    abi: erc20Abi,
    functionName: "name",
    chainId: targetNetwork.id,
  });

  // ----- Pool token balances (for display) -----
  const { data: poolBalance0 } = useReadContract({
    address: token0Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: poolAddress ? [poolAddress] : undefined,
    chainId: targetNetwork.id,
  });
  const { data: poolBalance1 } = useReadContract({
    address: token1Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: poolAddress ? [poolAddress] : undefined,
    chainId: targetNetwork.id,
  });

  // ----- Derived: SDK Token, fee tier, tick spacing -----
  const token0 = useMemo(() => {
    if (!chainConfig || !token0Address || dec0 == null || !symbol0 || !name0) return null;
    return new Token(chainConfig.chainId, token0Address, Number(dec0), symbol0, name0);
  }, [chainConfig, token0Address, dec0, symbol0, name0]);

  const token1 = useMemo(() => {
    if (!chainConfig || !token1Address || dec1 == null || !symbol1 || !name1) return null;
    return new Token(chainConfig.chainId, token1Address, Number(dec1), symbol1, name1);
  }, [chainConfig, token1Address, dec1, symbol1, name1]);

  const feeTier = poolFee != null ? Number(poolFee) : 3000;
  const tickSpacing = TICK_SPACINGS[feeTier as keyof typeof TICK_SPACINGS] ?? 60;

  // ----- User state: tick range, amounts, slippage, use live price -----
  const [currentTickManual, setCurrentTickManual] = useState(0);
  const [tickLower, setTickLower] = useState(-100);
  const [tickUpper, setTickUpper] = useState(100);
  const [calcAmount0Raw, setCalcAmount0Raw] = useState("");
  const [calcAmount1Raw, setCalcAmount1Raw] = useState("");
  const [slippageBips, setSlippageBips] = useState(50);
  const [useFetchedPrice, setUseFetchedPrice] = useState(true);

  const slot0Tuple = slot0 as readonly [bigint, number, number, number, number, number] | undefined;
  const fetchedTick = slot0Tuple != null ? Number(slot0Tuple[1]) : null;
  const currentTick = useFetchedPrice && fetchedTick != null ? fetchedTick : currentTickManual;
  const tickLowerAligned = nearestUsableTick(tickLower, tickSpacing);
  const tickUpperAligned = nearestUsableTick(tickUpper, tickSpacing);

  // ----- Derived: Pool (Uniswap v3-sdk) -----
  const pool = useMemo(() => {
    if (!token0 || !token1) return null;
    const useFetched = useFetchedPrice && slot0Tuple != null && liquidityRaw != null && fetchedTick != null;
    if (useFetched) {
      const sqrtRatioX96 = JSBI.BigInt(slot0Tuple[0].toString());
      const liquidity = JSBI.BigInt(liquidityRaw.toString());
      return new Pool(token0, token1, feeTier, sqrtRatioX96, liquidity, fetchedTick);
    }
    const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(currentTick);
    return new Pool(token0, token1, feeTier, sqrtRatioX96, JSBI.BigInt(0), currentTick);
  }, [token0, token1, feeTier, slot0Tuple, liquidityRaw, fetchedTick, currentTick, useFetchedPrice]);

  // ----- Human input → raw amounts (1 token = 10^decimals) -----
  const amount0RawForCalc = useMemo(() => {
    const num = parseFloat(calcAmount0Raw || "0");
    if (!Number.isFinite(num) || num <= 0 || !token0) return null;
    const decimals = token0.decimals ?? 18;
    const raw = Math.floor(num * 10 ** decimals);
    return raw > 0 ? raw.toString() : null;
  }, [calcAmount0Raw, token0]);

  const amount1RawForCalc = useMemo(() => {
    const num = parseFloat(calcAmount1Raw || "0");
    if (!Number.isFinite(num) || num <= 0 || !token1) return null;
    const decimals = token1.decimals ?? 18;
    const raw = Math.floor(num * 10 ** decimals);
    return raw > 0 ? raw.toString() : null;
  }, [calcAmount1Raw, token1]);

  // ----- Position math (v3-sdk: fromAmount0 / fromAmount1) -----
  const positionFromAmount0 = useMemo(() => {
    if (!pool || !amount0RawForCalc || tickLowerAligned >= tickUpperAligned) return null;
    try {
      return Position.fromAmount0({
        pool,
        tickLower: tickLowerAligned,
        tickUpper: tickUpperAligned,
        amount0: JSBI.BigInt(amount0RawForCalc),
        useFullPrecision: true,
      });
    } catch {
      return null;
    }
  }, [pool, tickLowerAligned, tickUpperAligned, amount0RawForCalc]);

  const positionFromAmount1 = useMemo(() => {
    if (!pool || !amount1RawForCalc || tickLowerAligned >= tickUpperAligned) return null;
    try {
      return Position.fromAmount1({
        pool,
        tickLower: tickLowerAligned,
        tickUpper: tickUpperAligned,
        amount1: JSBI.BigInt(amount1RawForCalc),
      });
    } catch {
      return null;
    }
  }, [pool, tickLowerAligned, tickUpperAligned, amount1RawForCalc]);

  const primaryPosition = positionFromAmount0 ?? positionFromAmount1;

  const mintCalldata = useMemo(() => {
    if (!primaryPosition || !address) return null;
    try {
      return NonfungiblePositionManager.addCallParameters(primaryPosition, {
        recipient: address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
        slippageTolerance: new Percent(slippageBips, 10_000),
      });
    } catch {
      return null;
    }
  }, [primaryPosition, address, slippageBips]);

  const inRange = pool != null ? currentTick >= tickLowerAligned && currentTick < tickUpperAligned : false;
  const poolDataReady = token0 != null && token1 != null;

  // ----- Early exits -----
  if (!chainConfig) {
    return <UnsupportedChainView networkName={targetNetwork.name} chainId={targetNetwork.id} />;
  }
  if (!poolAddress) {
    return <MissingPoolParamView />;
  }

  // ----- Main content -----
  return (
    <div className="flex items-center flex-col grow pt-6 pb-12 px-4 sm:px-6 lg:px-8 min-w-0 w-full overflow-hidden">
      <div className="w-full max-w-full min-w-0">
        <BackLink />
        <h1 className="text-3xl font-bold mb-2">Uniswap V3 LP Simulator</h1>
        {!poolDataReady && <p className="text-base-content/70 mb-8">Loading pool and token data from chain…</p>}

        {poolDataReady && (
          <PoolDataCard
            poolAddress={poolAddress}
            targetNetwork={targetNetwork}
            token0={{ address: token0Address, name: name0, symbol: symbol0, decimals: dec0, poolBalance: poolBalance0 }}
            token1={{ address: token1Address, name: name1, symbol: symbol1, decimals: dec1, poolBalance: poolBalance1 }}
            poolFee={poolFee as bigint | undefined}
            slot0={slot0Tuple}
            liquidityRaw={liquidityRaw as bigint | undefined}
            fetchedTick={fetchedTick}
            tickSpacing={tickSpacing}
            pool={pool}
            token0Loading={poolToken0Loading}
            token1Loading={poolToken1Loading}
            feeLoading={poolFeeLoading}
          />
        )}

        <LiquiditySimulatorCard
          tickSpacing={tickSpacing}
          useFetchedPrice={useFetchedPrice}
          setUseFetchedPrice={setUseFetchedPrice}
          slot0Loading={slot0Loading}
          liquidityLoading={liquidityLoading}
          fetchedTick={fetchedTick}
          currentTick={currentTick}
          setCurrentTickManual={setCurrentTickManual}
          tickLower={tickLower}
          setTickLower={setTickLower}
          tickUpper={tickUpper}
          setTickUpper={setTickUpper}
          tickLowerAligned={tickLowerAligned}
          tickUpperAligned={tickUpperAligned}
          inRange={inRange}
          token0={token0}
          token1={token1}
          calcAmount0Raw={calcAmount0Raw}
          setCalcAmount0Raw={setCalcAmount0Raw}
          calcAmount1Raw={calcAmount1Raw}
          setCalcAmount1Raw={setCalcAmount1Raw}
          positionFromAmount0={positionFromAmount0}
          positionFromAmount1={positionFromAmount1}
          primaryPosition={primaryPosition}
          pool={pool}
          mintCalldata={mintCalldata}
          slippageBips={slippageBips}
          setSlippageBips={setSlippageBips}
          walletAddress={address}
        />
      </div>
    </div>
  );
}

export default LpSimulatorPage;

// -----------------------------------------------------------------------------
// Presentational components (pool data card + simulator card)
// -----------------------------------------------------------------------------

type PoolDataCardProps = {
  poolAddress: string;
  targetNetwork: { name: string; id: number };
  token0: {
    address: string | undefined;
    name: string | undefined;
    symbol: string | undefined;
    decimals: number | bigint | undefined;
    poolBalance: bigint | undefined;
  };
  token1: {
    address: string | undefined;
    name: string | undefined;
    symbol: string | undefined;
    decimals: number | bigint | undefined;
    poolBalance: bigint | undefined;
  };
  poolFee: bigint | undefined;
  slot0: readonly [bigint, number, number, number, number, number] | undefined;
  liquidityRaw: bigint | undefined;
  fetchedTick: number | null;
  tickSpacing: number;
  pool: Pool | null;
  token0Loading: boolean;
  token1Loading: boolean;
  feeLoading: boolean;
};

function PoolDataCard({
  poolAddress,
  targetNetwork,
  token0: t0,
  token1: t1,
  poolFee,
  slot0,
  liquidityRaw,
  fetchedTick,
  tickSpacing,
  pool,
  token0Loading,
  token1Loading,
  feeLoading,
}: PoolDataCardProps) {
  const formatBalance = (raw: bigint | undefined, decimals: number | bigint | undefined, symbol: string | undefined) =>
    raw != null && decimals != null
      ? `${(Number(raw) / 10 ** Number(decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol ?? ""}`
      : "—";

  return (
    <div className="card bg-base-100 shadow-xl mb-6 min-w-0 overflow-hidden">
      <div className="card-body min-w-0 overflow-hidden">
        <h2 className="card-title text-lg mb-4">Pool data</h2>
        {(token0Loading || token1Loading || feeLoading) && <p className="text-warning text-sm mb-3">Loading…</p>}
        <div className="space-y-4">
          <div className="min-w-0">
            <p className="font-medium text-base-content/70 text-sm">Pool address</p>
            <p className="font-mono text-sm break-all">{poolAddress}</p>
          </div>
          <div>
            <p className="font-medium text-base-content/70 text-sm">Network</p>
            <p>
              {targetNetwork.name} (id: {targetNetwork.id})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
            <TokenInfoBlock
              label="Token0"
              name={t0.name}
              symbol={t0.symbol}
              address={t0.address}
              decimals={t0.decimals}
              poolBalance={formatBalance(t0.poolBalance, t0.decimals, t0.symbol)}
            />
            <TokenInfoBlock
              label="Token1"
              name={t1.name}
              symbol={t1.symbol}
              address={t1.address}
              decimals={t1.decimals}
              poolBalance={formatBalance(t1.poolBalance, t1.decimals, t1.symbol)}
            />
          </div>

          <div className="border-t border-base-300 pt-4">
            <p className="font-semibold mb-2">Slot0 & liquidity</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="font-medium text-base-content/70">Current tick</dt>
                <dd className="font-mono">{fetchedTick != null ? String(fetchedTick) : "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-base-content/70">sqrtPriceX96</dt>
                <dd className="font-mono text-xs break-all">{slot0 != null ? String(slot0[0]) : "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-base-content/70">Liquidity (raw)</dt>
                <dd className="font-mono text-xs break-all">{liquidityRaw != null ? String(liquidityRaw) : "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-base-content/70">Pool fee</dt>
                <dd className="font-mono">
                  {poolFee != null ? `${Number(poolFee) / 10_000}%` : "—"} (tick spacing: {tickSpacing})
                </dd>
              </div>
            </dl>
          </div>

          {pool != null && (
            <div className="border-t border-base-300 pt-4">
              <p className="font-semibold mb-2">Price</p>
              <p className="text-sm">
                1 {pool.token0.symbol} = <span className="font-mono">{pool.token0Price.toSignificant(8)}</span>{" "}
                {pool.token1.symbol}
              </p>
              <p className="text-sm mt-1">
                1 {pool.token1.symbol} = <span className="font-mono">{pool.token1Price.toSignificant(8)}</span>{" "}
                {pool.token0.symbol}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TokenInfoBlock({
  label,
  name,
  symbol,
  address,
  decimals,
  poolBalance,
}: {
  label: string;
  name: string | undefined;
  symbol: string | undefined;
  address: string | undefined;
  decimals: number | bigint | undefined;
  poolBalance: string;
}) {
  return (
    <div className="bg-base-200/50 rounded-lg p-4 min-w-0 overflow-hidden">
      <p className="font-semibold mb-3 break-words">{label}</p>
      <dl className="space-y-2 text-sm min-w-0">
        <div className="min-w-0">
          <dt className="font-medium text-base-content/70">Name</dt>
          <dd className="break-words">{name ?? "—"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="font-medium text-base-content/70">Symbol</dt>
          <dd className="break-words">{symbol ?? "—"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="font-medium text-base-content/70">Address</dt>
          <dd className="font-mono break-all text-xs">{address ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-base-content/70">Decimals</dt>
          <dd>{decimals != null ? String(decimals) : "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-base-content/70">Pool balance</dt>
          <dd className="font-mono">{poolBalance}</dd>
        </div>
      </dl>
    </div>
  );
}

type PositionLike = {
  liquidity: { toString: () => string };
  mintAmounts: { amount0: { toString: () => string }; amount1: { toString: () => string } };
  token0PriceLower: { toSignificant: (n: number) => string };
  token0PriceUpper: { toSignificant: (n: number) => string };
  amount0: { toSignificant: (n: number) => string };
  amount1: { toSignificant: (n: number) => string };
};

type LiquiditySimulatorCardProps = {
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

function LiquiditySimulatorCard({
  tickSpacing,
  useFetchedPrice,
  setUseFetchedPrice,
  slot0Loading,
  liquidityLoading,
  fetchedTick,
  currentTick,
  setCurrentTickManual,
  tickLower,
  setTickLower,
  tickUpper,
  setTickUpper,
  tickLowerAligned,
  tickUpperAligned,
  inRange,
  token0,
  token1,
  calcAmount0Raw,
  setCalcAmount0Raw,
  calcAmount1Raw,
  setCalcAmount1Raw,
  positionFromAmount0,
  positionFromAmount1,
  primaryPosition,
  pool,
  mintCalldata,
  slippageBips,
  setSlippageBips,
  walletAddress: address,
}: LiquiditySimulatorCardProps) {
  return (
    <div className="card bg-base-100 shadow-xl min-w-0 overflow-hidden">
      <div className="card-body gap-6 min-w-0 overflow-hidden">
        {/* Tick range & pool state */}
        <div>
          <h2 className="card-title text-lg mb-3">Liquidity position simulator</h2>
          <p className="text-sm text-base-content/70 mb-4">
            Set your price range with min/max tick. Ticks are snapped to spacing {tickSpacing}.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-base-200/50 rounded-xl p-4">
              <p className="font-semibold text-sm mb-3 text-base-content/80">Pool state</p>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="form-control flex-1 min-w-0">
                  <label className="label py-0">
                    <span className="label-text">Use live pool data</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-sm"
                      checked={useFetchedPrice}
                      onChange={e => setUseFetchedPrice(e.target.checked)}
                    />
                    {useFetchedPrice && (slot0Loading || liquidityLoading) && (
                      <span className="text-warning text-xs">Loading…</span>
                    )}
                  </div>
                </div>
                <div className="form-control flex-1 min-w-0 sm:max-w-[140px]">
                  <label className="label py-0">
                    <span className="label-text">Current tick</span>
                    {useFetchedPrice && fetchedTick != null && (
                      <span className="label-text-alt text-success">from chain</span>
                    )}
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    value={currentTick}
                    onChange={e => setCurrentTickManual(Number(e.target.value) || 0)}
                    disabled={useFetchedPrice && fetchedTick != null}
                  />
                </div>
              </div>
            </div>

            <div className="bg-base-200/50 rounded-xl p-4">
              <p className="font-semibold text-sm mb-3 text-base-content/80">Your price range</p>
              <p className="text-xs text-base-content/60 mb-3">
                Snapped to tick spacing {tickSpacing}. Current price in range = active liquidity.
              </p>
              <div className="flex flex-wrap items-end gap-4">
                <div className="form-control w-full sm:w-auto sm:min-w-[120px]">
                  <label className="label py-0">
                    <span className="label-text">Min tick</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    value={tickLower}
                    onChange={e => setTickLower(Number(e.target.value) ?? -100)}
                  />
                  <span className="label-text-alt mt-0.5 font-mono">→ {tickLowerAligned}</span>
                </div>
                <div className="form-control w-full sm:w-auto sm:min-w-[120px]">
                  <label className="label py-0">
                    <span className="label-text">Max tick</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    value={tickUpper}
                    onChange={e => setTickUpper(Number(e.target.value) ?? 100)}
                  />
                  <span className="label-text-alt mt-0.5 font-mono">→ {tickUpperAligned}</span>
                </div>
                {tickLowerAligned < tickUpperAligned && (
                  <div className={`badge badge-lg shrink-0 ${inRange ? "badge-success" : "badge-warning"}`}>
                    {inRange ? "In range" : "Out of range"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Calculator: enter one token amount */}
        <div>
          <h2 className="card-title text-lg mb-3">Calculator (Uniswap v3-sdk)</h2>
          <p className="text-sm text-base-content/70 mb-2">
            Enter <strong>one</strong> token amount. The calculator shows how much of the <strong>other</strong> token
            you need to open this liquidity position in your min–max tick range.
          </p>
          <div className="alert alert-info text-sm mb-4 min-w-0 overflow-hidden">
            <div className="min-w-0">
              <p className="font-semibold">What the numbers mean</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 opacity-90 break-words">
                <li>
                  <strong>You need to add</strong> = amount of the other token to deposit (what you send when minting).
                </li>
                <li>
                  <strong>Liquidity (L)</strong> = size of your position in the pool; the contract uses this internally.
                </li>
                <li>
                  <strong>Price range</strong> = your position is active between these prices (from min/max tick).
                </li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
            <CalculatorColumn
              token={token0}
              tokenRole="token0"
              otherSymbol={token1?.symbol}
              amountRaw={calcAmount0Raw}
              setAmountRaw={setCalcAmount0Raw}
              position={positionFromAmount0}
              otherDecimals={token1?.decimals ?? 18}
              mintAmountKey="amount1"
              placeholder="0"
            />
            <CalculatorColumn
              token={token1}
              tokenRole="token1"
              otherSymbol={token0?.symbol}
              amountRaw={calcAmount1Raw}
              setAmountRaw={setCalcAmount1Raw}
              position={positionFromAmount1}
              otherDecimals={token0?.decimals ?? 18}
              mintAmountKey="amount0"
              placeholder="0"
            />
          </div>

          <CalculationExplainer primaryPosition={primaryPosition} pool={pool} />
        </div>

        {/* Position summary */}
        {primaryPosition != null && (
          <>
            <div className="divider" />
            <PositionSummaryTable primaryPosition={primaryPosition} token0={token0} token1={token1} />
          </>
        )}

        {/* Mint calldata */}
        {mintCalldata != null && (
          <div>
            <h2 className="card-title text-lg mb-3">Mint calldata</h2>
            <div className="form-control mb-2">
              <label className="label">
                <span className="label-text">Slippage (bips)</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-28"
                value={slippageBips}
                onChange={e => setSlippageBips(Number(e.target.value) || 0)}
              />
            </div>
            <p className="text-sm text-base-content/70 mb-1 break-all">
              Recipient: {address}. Value (wei): {mintCalldata.value}
            </p>
            <pre className="bg-base-200 p-3 rounded-lg text-xs overflow-x-auto max-h-40 overflow-y-auto break-all min-w-0">
              {mintCalldata.calldata}
            </pre>
          </div>
        )}
        {address == null && (
          <p className="text-warning text-sm">
            Connect a wallet to see mint calldata (recipient and addCallParameters).
          </p>
        )}
      </div>
    </div>
  );
}

function CalculatorColumn({
  token,
  tokenRole,
  otherSymbol,
  amountRaw,
  setAmountRaw,
  position,
  otherDecimals,
  mintAmountKey,
  placeholder,
}: {
  token: Token | null;
  tokenRole: "token0" | "token1";
  otherSymbol: string | undefined;
  amountRaw: string;
  setAmountRaw: (v: string) => void;
  position: PositionLike | null;
  otherDecimals: number;
  mintAmountKey: "amount0" | "amount1";
  placeholder: string;
}) {
  const mintAmount = position?.mintAmounts[mintAmountKey];
  return (
    <div className="bg-base-200/50 rounded-lg p-4 min-w-0 overflow-hidden">
      <p className="font-semibold mb-3 break-words">
        I have {token?.symbol} ({tokenRole})
      </p>
      <div className="form-control mb-3 min-w-0">
        <label className="label py-0">
          <span className="label-text break-words">Amount of {token?.symbol} (1 = one whole token)</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          className="input input-bordered w-full font-mono"
          value={amountRaw}
          onChange={e => setAmountRaw(e.target.value)}
        />
      </div>
      {position != null && mintAmount != null ? (
        <dl className="space-y-2 text-sm min-w-0">
          <div className="min-w-0">
            <dt className="text-base-content/70 break-words">You need to add {otherSymbol}</dt>
            <dd className="font-semibold text-base break-all">
              {`${formatTokenAmount(mintAmount.toString(), otherDecimals)} ${otherSymbol}`}
            </dd>
            <dd className="text-xs text-base-content/60 font-mono mt-0.5 break-all">
              raw for contract: {mintAmount.toString()}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-base-content/70">Liquidity (L)</dt>
            <dd className="font-mono break-all">{position.liquidity.toString()}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-base-content/70">Price range (token0 per token1)</dt>
            <dd className="font-mono text-xs break-words">
              {position.token0PriceLower.toSignificant(6)} – {position.token0PriceUpper.toSignificant(6)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-base-content/60">Enter amount to see required {otherSymbol}</p>
      )}
    </div>
  );
}

function formatTokenAmount(raw: string, decimals: number) {
  return (Number(raw) / 10 ** decimals).toLocaleString(undefined, {
    maximumFractionDigits: 8,
    minimumFractionDigits: 0,
  });
}

function CalculationExplainer({ primaryPosition, pool }: { primaryPosition: PositionLike | null; pool: Pool | null }) {
  return (
    <details className="mt-6 min-w-0 overflow-hidden">
      <summary className="cursor-pointer font-semibold text-base-content/80 hover:text-base-content">
        How the calculation works (Uniswap V3 & v3-sdk)
      </summary>
      <div className="mt-4 space-y-4 text-sm border border-base-300 rounded-lg p-4 bg-base-200/30">
        <div>
          <p className="font-medium mb-2">Steps (what the SDK does)</p>
          <ol className="list-decimal list-inside space-y-1 break-words">
            <li>
              You choose a <strong>price range</strong> [min tick, max tick] → converted to sqrt prices √P_a, √P_b
              (token0 per token1).
            </li>
            <li>
              You supply <strong>one</strong> token amount (token0 or token1). The pool’s <strong>current price</strong>{" "}
              √P comes from the pool (slot0).
            </li>
            <li>
              <code className="bg-base-300 px-1 rounded">Position.fromAmount0</code> or{" "}
              <code className="bg-base-300 px-1 rounded">Position.fromAmount1</code> (from{" "}
              <code className="bg-base-300 px-1 rounded">@uniswap/v3-sdk</code>) computes <strong>liquidity L</strong>{" "}
              and the <strong>required amount</strong> of the other token using Uniswap V3’s concentrated liquidity
              math.
            </li>
            <li>
              The contract stores <strong>L</strong> and your tick range; mint amounts are what you send to open the
              position.
            </li>
          </ol>
        </div>
        <div>
          <p className="font-medium mb-2">Uniswap V3 formulas (concentrated liquidity)</p>
          <p className="text-base-content/80 mb-2">
            Price is expressed as √P (sqrt price). For range [√P_a, √P_b] and liquidity L:
          </p>
          <ul className="list-disc list-inside space-y-1 font-mono text-xs break-words">
            <li>From token0 amount: L = (amount0 · √P_a · √P_b) / (√P_b − √P_a)</li>
            <li>From token1 amount: L = amount1 / (√P_b − √P_a)</li>
            <li>Token0 in position: amount0 = L · (1/√P − 1/√P_b) (when current √P in range)</li>
            <li>Token1 in position: amount1 = L · (√P − √P_a) (when current √P in range)</li>
          </ul>
          <p className="mt-2 text-base-content/70 text-xs">
            The v3-sdk uses Q64.96 (sqrtRatioX96) and full-precision math; the contract uses the same logic
            (SqrtPriceMath, etc.).
          </p>
        </div>
        {primaryPosition != null && pool != null && (
          <div>
            <p className="font-medium mb-2">Applied to your position</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs break-all">
              <dt className="text-base-content/70">Price lower (token0/token1)</dt>
              <dd>{primaryPosition.token0PriceLower.toSignificant(10)}</dd>
              <dt className="text-base-content/70">Price upper (token0/token1)</dt>
              <dd>{primaryPosition.token0PriceUpper.toSignificant(10)}</dd>
              <dt className="text-base-content/70">Pool current price (token0/token1)</dt>
              <dd>{pool.token0Price.toSignificant(10)}</dd>
              <dt className="text-base-content/70">Pool current price (token1/token0)</dt>
              <dd>{pool.token1Price.toSignificant(10)}</dd>
              <dt className="text-base-content/70">Liquidity L (from SDK)</dt>
              <dd>{primaryPosition.liquidity.toString()}</dd>
              <dt className="text-base-content/70">Mint amount0 (raw)</dt>
              <dd>{primaryPosition.mintAmounts.amount0.toString()}</dd>
              <dt className="text-base-content/70">Mint amount1 (raw)</dt>
              <dd>{primaryPosition.mintAmounts.amount1.toString()}</dd>
            </dl>
            <p className="mt-2 text-base-content/70 text-xs break-words">
              These values come from <code className="bg-base-300 px-0.5 rounded">Position.fromAmount0</code> or{" "}
              <code className="bg-base-300 px-0.5 rounded">Position.fromAmount1</code>; the SDK computes L and the other
              token amount from the formulas above using the pool state and your range.
            </p>
          </div>
        )}
      </div>
    </details>
  );
}

function PositionSummaryTable({
  primaryPosition,
  token0,
  token1,
}: {
  primaryPosition: PositionLike;
  token0: Token | null;
  token1: Token | null;
}) {
  const dec0 = token0?.decimals ?? 18;
  const dec1 = token1?.decimals ?? 18;
  return (
    <div>
      <h2 className="card-title text-lg mb-3">Position summary</h2>
      <p className="text-sm text-base-content/70 mb-3 break-words">
        <strong>Deposit</strong> = what you send to open the position. <strong>If you close now</strong> = what you’d
        get back at the current pool price (one side can be 0 if price is outside your range).
      </p>
      <div className="overflow-x-auto min-w-0">
        <table className="table table-zebra table-sm table-fixed w-full">
          <tbody>
            <tr>
              <td className="font-medium w-1/3">Liquidity (L, raw)</td>
              <td className="font-mono text-sm break-all">{primaryPosition.liquidity.toString()}</td>
            </tr>
            <tr className="bg-base-200/30">
              <td colSpan={2} className="font-medium pt-2">
                Amounts to deposit (mint)
              </td>
            </tr>
            <tr>
              <td className="font-medium pl-4 w-1/3 break-words">Token0 ({token0?.symbol})</td>
              <td className="font-mono text-sm break-all">
                {primaryPosition.mintAmounts.amount0.toString()} raw ={" "}
                {formatTokenAmount(primaryPosition.mintAmounts.amount0.toString(), dec0)} {token0?.symbol}
              </td>
            </tr>
            <tr>
              <td className="font-medium pl-4 w-1/3 break-words">Token1 ({token1?.symbol})</td>
              <td className="font-mono text-sm break-all">
                {primaryPosition.mintAmounts.amount1.toString()} raw ={" "}
                {formatTokenAmount(primaryPosition.mintAmounts.amount1.toString(), dec1)} {token1?.symbol}
              </td>
            </tr>
            <tr className="bg-base-200/30">
              <td colSpan={2} className="font-medium pt-2">
                If you closed the position at current price
              </td>
            </tr>
            <tr>
              <td className="font-medium pl-4 w-1/3 break-words">Token0 ({token0?.symbol})</td>
              <td className="font-mono text-sm break-all">
                {primaryPosition.amount0.toSignificant(18)} {token0?.symbol}
              </td>
            </tr>
            <tr>
              <td className="font-medium pl-4 w-1/3 break-words">Token1 ({token1?.symbol})</td>
              <td className="font-mono text-sm break-all">
                {primaryPosition.amount1.toSignificant(6)} {token1?.symbol}
              </td>
            </tr>
            <tr>
              <td className="font-medium w-1/3">Price range (min–max tick)</td>
              <td className="font-mono text-sm break-all">
                {primaryPosition.token0PriceLower.toSignificant(8)} –{" "}
                {primaryPosition.token0PriceUpper.toSignificant(8)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
