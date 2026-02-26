import math

# ---------- UNISWAP V3 CONSTANTS ----------
TICK_BASE = 1.0001 ** 0.5  # sqrt(1.0001) for sqrtPrice calculation

# ---------- TICK <-> SQRT PRICE ----------
def tick_to_sqrt_price(tick: int) -> float:
    return TICK_BASE ** tick

# ---------- CORE LIQUIDITY MATH ----------
def compute_from_token0(amount0, sqrtP, sqrtPmin, sqrtPmax):
    L = amount0 * (sqrtP * sqrtPmax) / (sqrtPmax - sqrtP)
    amount1 = L * (sqrtP - sqrtPmin)
    return L, amount1

def compute_from_token1(amount1, sqrtP, sqrtPmin, sqrtPmax):
    L = amount1 / (sqrtP - sqrtPmin)
    amount0 = L * (sqrtPmax - sqrtP) / (sqrtP * sqrtPmax)
    return L, amount0

# ---------- MAIN CALCULATOR ----------
def compute_position(current_tick, tick_min, tick_max, tick_spacing,
                     amount_token0=None, amount_token1=None, current_price=None):
    
    # Tick validations
    if tick_min % tick_spacing != 0 or tick_max % tick_spacing != 0:
        raise ValueError("Ticks must align with tick spacing")
    if tick_min >= tick_max:
        raise ValueError("tick_min must be < tick_max")
    if not (tick_min <= current_tick < tick_max):
        raise ValueError("Current tick must be within range")
    
    sqrtPmin = tick_to_sqrt_price(tick_min)
    sqrtPmax = tick_to_sqrt_price(tick_max)
    sqrtP = tick_to_sqrt_price(current_tick)
    if current_price is not None:
        sqrtP = math.sqrt(current_price)
    
    result = {}
    
    if amount_token0 is not None:
        L0, token1_needed = compute_from_token0(amount_token0, sqrtP, sqrtPmin, sqrtPmax)
        result['token0_case'] = {
            "token0": amount_token0,
            "token1_required": token1_needed,
            "liquidity": L0
        }
    
    if amount_token1 is not None:
        L1, token0_needed = compute_from_token1(amount_token1, sqrtP, sqrtPmin, sqrtPmax)
        result['token1_case'] = {
            "token1": amount_token1,
            "token0_required": token0_needed,
            "liquidity": L1
        }
    
    if not result:
        raise ValueError("Provide at least amount_token0 or amount_token1")
    
    # Include current prices for reference
    result['current_price'] = sqrtP**2
    result['sqrt_price_min'] = sqrtPmin
    result['sqrt_price_max'] = sqrtPmax
    
    return result

# ---------- EXAMPLE USAGE ----------
if __name__ == "__main__":
    # Pool parameters
    current_tick = -32
    tick_min = -1140
    tick_max = 960
    tick_spacing = 60
    #current_price = 0.9968  # optional override
    
    # Run both token0 and token1 tests in parallel
    result = compute_position(
        current_tick=current_tick,
        tick_min=tick_min,
        tick_max=tick_max,
        tick_spacing=tick_spacing,
        amount_token0=1.0,   # test for token0 input
        amount_token1=1.0,   # test for token1 input
        #current_price=current_price
    )
    
    # Display results
    if 'token0_case' in result:
        t0 = result['token0_case']
        print(f"✅ Given {t0['token0']} token0, requires {t0['token1_required']:.4f} token1, Liquidity L={t0['liquidity']:.4f}")
    if 'token1_case' in result:
        t1 = result['token1_case']
        print(f"✅ Given {t1['token1']} token1, requires {t1['token0_required']:.4f} token0, Liquidity L={t1['liquidity']:.4f}")
    
    print(f"📊 Current price: {result['current_price']:.4f}, Range: [{result['sqrt_price_min']**2:.4f}, {result['sqrt_price_max']**2:.4f}]")