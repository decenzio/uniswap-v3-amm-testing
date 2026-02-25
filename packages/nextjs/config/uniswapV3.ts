/**
 * Uniswap V3 config per chain (factory, NPM).
 * Pool address is not in config: use URL param ?ammPool=0x... on /lp (pool is the data source).
 */

export type UniswapV3ChainConfig = {
  chainId: number;
  /** Uniswap V3 Factory address */
  factoryAddress: string;
  /** NonfungiblePositionManager address */
  nonfungiblePositionManagerAddress: string;
};

export const UNISWAP_V3_CONFIG: Record<number, UniswapV3ChainConfig> = {
  11155111: {
    chainId: 11155111,
    factoryAddress: "0xF17dc403794CF934E787f8BC0e95ACc136a157D6",
    nonfungiblePositionManagerAddress: "0xb02242D7eE547130a12927847f015C02baAB4431",
  },
};

export function getUniswapV3Config(chainId: number): UniswapV3ChainConfig | undefined {
  return UNISWAP_V3_CONFIG[chainId];
}
