import type { PoolDataCardProps } from "../types";
import { TokenInfoBlock } from "./TokenInfoBlock";

function formatBalance(raw: bigint | undefined, decimals: number | bigint | undefined, symbol: string | undefined) {
  return raw != null && decimals != null
    ? `${(Number(raw) / 10 ** Number(decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol ?? ""}`
    : "—";
}

export function PoolDataCard({
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
