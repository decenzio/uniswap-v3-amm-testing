# LP Simulator (Uniswap V3)

Uniswap V3 concentrated-liquidity LP simulator: pick a pool via URL, set a tick range and one token amount, and see the required other token amount, liquidity (L), and mint calldata.

## How to use

1. **Open the page with a pool address** (required):
   ```
   /lp?ammPool=0xYourUniswapV3PoolAddress
   ```
   Example: [/lp?ammPool=0xB7f0fbE6eaC7C096c1665546b747B65fE6277381](/lp?ammPool=0xB7f0fbE6eaC7C096c1665546b747B65fE6277381) (Sepolia).

2. **Supported chain** is configured in `config/uniswapV3.ts` (e.g. Sepolia). Switch the app to that network.

3. **Set your price range** (min/max tick) and **enter one token amount**. The UI shows the required other token, liquidity L, and mint calldata for the NonfungiblePositionManager.

## Data flow

1. **URL** → `ammPool` query param is parsed and validated as an Ethereum address.
2. **Pool data** → Contract reads (token0, token1, fee, slot0, liquidity) and token metadata (decimals, symbol, name) and pool token balances. All from the pool contract and ERC20s.
3. **Simulator state** → User inputs (tick range, one token amount, slippage, “use live price”) are combined with pool data to build a v3-sdk `Pool` and `Position`, then mint calldata.
4. **UI** → Pool info card + simulator card (tick range, calculator, position summary, mint calldata).

## Directory structure

```
app/lp/
├── README.md                 # This file
├── page.tsx                  # Entry: Suspense wrapper, URL + hooks, early exits, layout
├── types.ts                  # Shared types (PositionLike, Slot0Tuple, card props, etc.)
├── lib/                      # Pure logic (no React)
│   ├── url.ts               # parsePoolFromUrl(ammPool param)
│   └── position.ts           # Token amount & position math (see below)
├── hooks/
│   ├── usePoolData.ts        # Reads pool + tokens + balances; returns Token, slot0, fee, etc.
│   └── useLpSimulatorState.ts # User state + derived pool/positions/mintCalldata
└── components/
    ├── index.ts
    ├── BackLink.tsx
    ├── UnsupportedChainView.tsx   # Chain not in config
    ├── MissingPoolParamView.tsx   # No ammPool in URL
    ├── PoolDataCard.tsx           # Pool address, tokens, slot0, liquidity, price
    ├── TokenInfoBlock.tsx         # Single-token name/symbol/address/decimals/balance
    ├── LiquiditySimulatorCard.tsx # Tick range + calculator + summary + mint calldata
    ├── CalculatorColumn.tsx       # “I have token0/token1” input + computed other token + L
    ├── CalculationExplainer.tsx    # “How the calculation works” + applied-to-position
    └── PositionSummaryTable.tsx    # Deposit amounts + “if you close now”
```

## Token amount calculation logic

**All token amount and position math lives in `lib/position.ts`.** No other file implements these formulas.

| Function | Purpose |
|----------|--------|
| **`humanAmountToRaw(amountStr, decimals)`** | Converts a human amount (e.g. `"1.5"`) to raw wei/smallest unit: `floor(amount * 10^decimals)`. Returns `null` if invalid or zero. |
| **`buildPool(token0, token1, feeTier, opts)` | Builds a v3-sdk `Pool`. If `useFetched: true`, uses `slot0` (sqrtPriceX96, tick) and `liquidityRaw` from chain; otherwise uses a manual `currentTick` and zero liquidity. |
| **`getTickSpacing(feeTier)`** | Maps fee tier (e.g. 3000) to Uniswap V3 tick spacing (e.g. 60). |
| **`positionFromAmount0(pool, tickLower, tickUpper, amount0Raw)`** | “I want to add this much token0.” Calls v3-sdk `Position.fromAmount0` to get liquidity L and the **required token1 amount**. |
| **`positionFromAmount1(pool, tickLower, tickUpper, amount1Raw)`** | “I want to add this much token1.” Calls v3-sdk `Position.fromAmount1` to get L and the **required token0 amount**. |
| **`buildMintCalldata(position, recipient, slippageBips)`** | Builds `NonfungiblePositionManager.addCallParameters` (value + calldata) for minting the position. |
| **`formatTokenAmount(raw, decimals)`** | Formats a raw amount for display: `raw / 10^decimals` with fixed decimal places. |

The v3-sdk does the concentrated-liquidity math (L and the other token amount from one side). Our code only converts human input to raw, builds the `Pool`, calls `Position.fromAmount0` / `Position.fromAmount1`, and builds mint calldata.

## Config and ABIs

- **`config/uniswapV3.ts`** — Per-chain config: `chainId`, `factoryAddress`, `nonfungiblePositionManagerAddress`. Pool address is **not** in config; it comes from the URL.
- **`config/abis/uniswapV3Pool.json`** — Uniswap V3 Pool ABI (slot0, token0, token1, fee, liquidity, etc.).
- **`config/abis/erc20.ts`** — ERC20 (decimals, symbol, name, balanceOf) for token metadata and pool balances.

## Dependencies

- `@uniswap/sdk-core` — `Token`, `Percent`.
- `@uniswap/v3-sdk` — `Pool`, `Position`, `TickMath`, `TICK_SPACINGS`, `nearestUsableTick`, `NonfungiblePositionManager`.
- `jsbi` — Used by the SDK for big integers.

## Files that use Uniswap libraries

- **Logic:** `lib/position.ts` (all pool/position/amount and mint calldata logic).
- **Hooks:** `usePoolData.ts` (builds SDK `Token`), `useLpSimulatorState.ts` (builds `Pool`, calls `position.ts`, uses `nearestUsableTick`).
- **Types / UI:** `types.ts`, `CalculatorColumn.tsx`, `CalculationExplainer.tsx`, `PositionSummaryTable.tsx` (types or display only).
