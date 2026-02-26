import type { PositionLike } from "../types";
import type { Pool } from "@uniswap/v3-sdk";

function toSqrtPrice(priceSig: string): number {
  const p = parseFloat(priceSig);
  return Number.isFinite(p) && p > 0 ? Math.sqrt(p) : 0;
}

function formatNum(x: number): string {
  if (x >= 1e6 || (x > 0 && x < 1e-4)) return x.toExponential(4);
  return x.toLocaleString(undefined, { maximumFractionDigits: 6, minimumFractionDigits: 0 });
}

type Props = {
  primaryPosition: PositionLike | null;
  pool: Pool | null;
  /** True when primary position was computed from token0 amount (user entered token0). */
  usedAmount0?: boolean;
};

export function CalculationExplainer({ primaryPosition, pool, usedAmount0 = false }: Props) {
  const hasRealData = primaryPosition != null && pool != null;
  const sqrtP_a = hasRealData ? toSqrtPrice(primaryPosition!.token0PriceLower.toSignificant(18)) : 0;
  const sqrtP_b = hasRealData ? toSqrtPrice(primaryPosition!.token0PriceUpper.toSignificant(18)) : 0;
  const sqrtP = hasRealData ? toSqrtPrice(pool!.token0Price.toSignificant(18)) : 0;
  const amount0Human = hasRealData ? primaryPosition!.amount0.toSignificant(8) : "";
  const amount1Human = hasRealData ? primaryPosition!.amount1.toSignificant(8) : "";
  const L = hasRealData ? primaryPosition!.liquidity.toString() : "";

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
        {hasRealData && (
          <div>
            <p className="font-medium mb-2">Current calculation (your position, with real numbers)</p>
            <p className="text-base-content/80 mb-2 text-xs">
              Your range and pool price → sqrt prices; then L and the other token from the formula.
            </p>
            <ol className="list-decimal list-inside space-y-2 font-mono text-xs break-words ml-2">
              <li>
                Range → sqrt prices: √P_a = √(price lower) = <strong>{formatNum(sqrtP_a)}</strong>, √P_b = √(price
                upper) = <strong>{formatNum(sqrtP_b)}</strong>. Current √P = <strong>{formatNum(sqrtP)}</strong>.
              </li>
              {usedAmount0 ? (
                <>
                  <li>
                    You entered <strong>{amount0Human} token0</strong>. L = (amount0 · √P_a · √P_b) / (√P_b − √P_a) →
                    SDK gives <strong>L = {L}</strong>.
                  </li>
                  <li>
                    Token1 needed: amount1 = L · (√P − √P_a) → <strong>{amount1Human} token1</strong>.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    You entered <strong>{amount1Human} token1</strong>. L = amount1 / (√P_b − √P_a) → SDK gives{" "}
                    <strong>L = {L}</strong>.
                  </li>
                  <li>
                    Token0 needed: amount0 = L · (1/√P − 1/√P_b) → <strong>{amount0Human} token0</strong>.
                  </li>
                </>
              )}
            </ol>
          </div>
        )}
        <details className="min-w-0 overflow-hidden">
          <summary className="cursor-pointer font-medium text-base-content/80 hover:text-base-content">
            Worked example (generic numbers)
          </summary>
          <div className="mt-3 space-y-3 text-xs">
            <p className="text-base-content/80">
              Example: range [√P_a, √P_b] with current price √P. You supply one side; we compute L, then the other
              token.
            </p>
            <p className="font-medium text-base-content/90">Case A — You enter amount of token0 (e.g. 100 token0)</p>
            <ol className="list-decimal list-inside space-y-1 font-mono break-words ml-2">
              <li>Range → sqrt prices: √P_a = 1, √P_b = 2 (e.g. from tick range). Current √P = 1.5.</li>
              <li>
                Liquidity from token0: L = (amount0 · √P_a · √P_b) / (√P_b − √P_a) = (100 · 1 · 2) / (2 − 1) ={" "}
                <strong>200</strong>.
              </li>
              <li>
                Token1 needed: amount1 = L · (√P − √P_a) = 200 · (1.5 − 1) = 200 · 0.5 = <strong>100 token1</strong>.
              </li>
            </ol>
            <p className="font-medium text-base-content/90 mt-2">
              Case B — You enter amount of token1 (e.g. 100 token1)
            </p>
            <ol className="list-decimal list-inside space-y-1 font-mono break-words ml-2">
              <li>Same range: √P_a = 1, √P_b = 2, current √P = 1.5.</li>
              <li>
                Liquidity from token1: L = amount1 / (√P_b − √P_a) = 100 / (2 − 1) = <strong>100</strong>.
              </li>
              <li>
                Token0 needed: amount0 = L · (1/√P − 1/√P_b) = 100 · (1/1.5 − 1/2) = 100 · (0.666… − 0.5) ≈{" "}
                <strong>16.67 token0</strong>.
              </li>
            </ol>
          </div>
        </details>
        {hasRealData && (
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
