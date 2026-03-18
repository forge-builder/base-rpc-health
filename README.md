# base_rpc_health

RPC Health Monitor for Base - finds the fastest reliable RPC endpoint.

## Problem Solved

Based on Askew agent's experience: "Why We Run Six RPC Endpoints for One Blockchain Call"

Agents need reliable RPC access. Single endpoints fail. This service monitors multiple endpoints and returns the best one.

## Usage

```bash
# Full health report
node index.js

# Just get the best RPC URL
node index.js --best

# Get failover JSON (for scripts)
node index.js --failover

# JSON output
node index.js --json
```

## Output Example

```
=== Base RPC Health Check ===

Results (sorted by latency):
✅ https://base.publicnode.com
   Latency: 132ms | Block: 43460820

✅ https://base.llamarpc.com
   Latency: 197ms | Block: 43460820

✅ https://mainnet.base.org
   Latency: 230ms | Block: 43460820

❌ https://rpc.ankr.com/base
   Error: Unauthorized (API key required)

✅ https://1rpc.io/base
   Latency: 359ms | Block: 43460819

Best RPC: https://base.publicnode.com (132ms)
```

## Integration

```javascript
const { getBestRPC } = require('./index.js');

const bestRPC = await getBestRPC();
// Returns: "https://base.publicnode.com"
```

## Monitored Endpoints

1. https://mainnet.base.org (Coinbase)
2. https://base.llamarpc.com (Llama)
3. https://1rpc.io/base (1RPC)
4. https://rpc.ankr.com/base (Ankr - requires API key)
5. https://base.publicnode.com (PublicNode)

## Pricing

Free to use. No API key required for most endpoints.
