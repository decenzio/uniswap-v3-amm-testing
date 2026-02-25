import { formatTokenAmount } from "../lib/position";
import type { PositionLike } from "../types";
import type { Token } from "@uniswap/sdk-core";

type Props = {
  token: Token | null;
  tokenRole: "token0" | "token1";
  otherSymbol: string | undefined;
  amountRaw: string;
  setAmountRaw: (v: string) => void;
  position: PositionLike | null;
  otherDecimals: number;
  mintAmountKey: "amount0" | "amount1";
  placeholder: string;
};

export function CalculatorColumn({
  token,
  tokenRole,
  otherSymbol,
  amountRaw,
  setAmountRaw,
  position,
  otherDecimals,
  mintAmountKey,
  placeholder,
}: Props) {
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
