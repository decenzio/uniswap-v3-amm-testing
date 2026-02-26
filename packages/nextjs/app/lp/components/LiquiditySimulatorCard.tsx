import type { LiquiditySimulatorCardProps } from "../types";
import { CalculationExplainer } from "./CalculationExplainer";
import { CalculatorColumn } from "./CalculatorColumn";
import { PositionSummaryTable } from "./PositionSummaryTable";

export function LiquiditySimulatorCard({
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

          <CalculationExplainer
            primaryPosition={primaryPosition}
            pool={pool}
            usedAmount0={positionFromAmount0 != null}
          />
        </div>

        {primaryPosition != null && (
          <>
            <div className="divider" />
            <PositionSummaryTable primaryPosition={primaryPosition} token0={token0} token1={token1} />
          </>
        )}

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
