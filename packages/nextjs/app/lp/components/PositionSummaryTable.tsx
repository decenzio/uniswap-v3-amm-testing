import { formatTokenAmount } from "../lib/position";
import type { PositionLike } from "../types";
import type { Token } from "@uniswap/sdk-core";

type Props = {
  primaryPosition: PositionLike;
  token0: Token | null;
  token1: Token | null;
};

export function PositionSummaryTable({ primaryPosition, token0, token1 }: Props) {
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
