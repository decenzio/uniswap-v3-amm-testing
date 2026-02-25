import { BackLink } from "./BackLink";

type Props = { networkName: string; chainId: number };

export function UnsupportedChainView({ networkName, chainId }: Props) {
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
