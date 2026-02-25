type Props = {
  label: string;
  name: string | undefined;
  symbol: string | undefined;
  address: string | undefined;
  decimals: number | bigint | undefined;
  poolBalance: string;
};

export function TokenInfoBlock({ label, name, symbol, address, decimals, poolBalance }: Props) {
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
