import type { PositionLike } from "../types";
import type { Pool } from "@uniswap/v3-sdk";

type Props = { primaryPosition: PositionLike | null; pool: Pool | null };

export function CalculationExplainer({ primaryPosition, pool }: Props) {
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
