import Link from "next/link";
import { BackLink } from "./BackLink";

export function MissingPoolParamView() {
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
