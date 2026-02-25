"use client";

/**
 * LP Simulator page — Uniswap V3 concentrated liquidity.
 *
 * Flow:
 * 1. Pool address from URL (?ammPool=0x...). Chain config from config/uniswapV3.
 * 2. usePoolData reads pool + token metadata + balances; useLpSimulatorState handles tick/amounts and position math.
 * 3. UI: PoolDataCard + LiquiditySimulatorCard.
 */
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  BackLink,
  LiquiditySimulatorCard,
  MissingPoolParamView,
  PoolDataCard,
  UnsupportedChainView,
} from "./components";
import { useLpSimulatorState } from "./hooks/useLpSimulatorState";
import { usePoolData } from "./hooks/usePoolData";
import { parsePoolFromUrl } from "./lib/url";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

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
  const poolAddress = useMemo(() => parsePoolFromUrl(searchParams.get("ammPool")), [searchParams]);

  const poolData = usePoolData({
    poolAddress,
    chainId: targetNetwork.id,
  });

  const state = useLpSimulatorState({
    token0: poolData.token0,
    token1: poolData.token1,
    feeTier: poolData.feeTier,
    slot0Tuple: poolData.slot0Tuple,
    liquidityRaw: poolData.liquidityRaw,
    fetchedTick: poolData.fetchedTick,
    slot0Loading: poolData.slot0Loading,
    liquidityLoading: poolData.liquidityLoading,
    walletAddress: address,
  });

  if (!poolData.chainConfig) {
    return <UnsupportedChainView networkName={targetNetwork.name} chainId={targetNetwork.id} />;
  }
  if (!poolAddress) {
    return <MissingPoolParamView />;
  }

  const poolDataReady = poolData.token0 != null && poolData.token1 != null;

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
            token0={{
              address: poolData.token0Address,
              name: poolData.name0,
              symbol: poolData.symbol0,
              decimals: poolData.dec0,
              poolBalance: poolData.poolBalance0,
            }}
            token1={{
              address: poolData.token1Address,
              name: poolData.name1,
              symbol: poolData.symbol1,
              decimals: poolData.dec1,
              poolBalance: poolData.poolBalance1,
            }}
            poolFee={poolData.poolFee}
            slot0={poolData.slot0Tuple}
            liquidityRaw={poolData.liquidityRaw}
            fetchedTick={poolData.fetchedTick}
            tickSpacing={poolData.tickSpacing}
            pool={state.pool}
            token0Loading={poolData.poolToken0Loading}
            token1Loading={poolData.poolToken1Loading}
            feeLoading={poolData.poolFeeLoading}
          />
        )}

        <LiquiditySimulatorCard
          tickSpacing={poolData.tickSpacing}
          useFetchedPrice={state.useFetchedPrice}
          setUseFetchedPrice={state.setUseFetchedPrice}
          slot0Loading={state.slot0Loading}
          liquidityLoading={state.liquidityLoading}
          fetchedTick={poolData.fetchedTick}
          currentTick={state.currentTick}
          setCurrentTickManual={state.setCurrentTickManual}
          tickLower={state.tickLower}
          setTickLower={state.setTickLower}
          tickUpper={state.tickUpper}
          setTickUpper={state.setTickUpper}
          tickLowerAligned={state.tickLowerAligned}
          tickUpperAligned={state.tickUpperAligned}
          inRange={state.inRange}
          token0={poolData.token0}
          token1={poolData.token1}
          calcAmount0Raw={state.calcAmount0Raw}
          setCalcAmount0Raw={state.setCalcAmount0Raw}
          calcAmount1Raw={state.calcAmount1Raw}
          setCalcAmount1Raw={state.setCalcAmount1Raw}
          positionFromAmount0={state.positionFromAmount0}
          positionFromAmount1={state.positionFromAmount1}
          primaryPosition={state.primaryPosition}
          pool={state.pool}
          mintCalldata={state.mintCalldata}
          slippageBips={state.slippageBips}
          setSlippageBips={state.setSlippageBips}
          walletAddress={address}
        />
      </div>
    </div>
  );
}

export default LpSimulatorPage;
