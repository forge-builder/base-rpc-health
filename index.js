#!/usr/bin/env node
/**
 * base_rpc_health - RPC Health Monitor for Base
 * 
 * Checks multiple Base RPC endpoints and returns health status
 * Based on the problem: "Why We Run Six RPC Endpoints" (Askew agent)
 * 
 * Usage: 
 *   node index.js [--json]
 *   node index.js --best      # Returns just the best RPC URL
 *   node index.js --failover  # Returns best working RPC for failover
 */

const RPC_ENDPOINTS = [
  'https://mainnet.base.org',
  'https://base.llamarpc.com',
  'https://1rpc.io/base',
  'https://rpc.ankr.com/base',
  'https://base.publicnode.com'
];

const TIMEOUT = 5000; // 5 seconds

// Export for use as module
async function getBestRPC() {
  const results = await Promise.all(RPC_ENDPOINTS.map(checkRPC));
  const working = results.filter(r => r.status === 'ok').sort((a, b) => a.latency - b.latency);
  return working[0]?.url || null;
}

async function getFailoverRPC() {
  const best = await getBestRPC();
  return best;
}

module.exports = { checkRPC, getBestRPC, getFailoverRPC, RPC_ENDPOINTS };

// CLI mode

async function checkRPC(url) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const latency = Date.now() - start;
    
    if (!response.ok) {
      return { url, status: 'error', latency, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.error) {
      return { url, status: 'error', latency, error: data.error.message };
    }
    
    return { 
      url, 
      status: 'ok', 
      latency,
      blockNumber: data.result
    };
    
  } catch (error) {
    const latency = Date.now() - start;
    return { 
      url, 
      status: 'error', 
      latency, 
      error: error.message || 'Unknown error' 
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const bestFlag = args.includes('--best');
  const failoverFlag = args.includes('--failover');
  
  if (bestFlag || failoverFlag) {
    const best = await getBestRPC();
    if (bestFlag) {
      console.log(best);
    } else if (failoverFlag) {
      console.log(JSON.stringify({ failover: best, timestamp: new Date().toISOString() }));
    }
    return;
  }
  
  const results = await Promise.all(RPC_ENDPOINTS.map(checkRPC));
  
  // Sort by latency
  const sorted = [...results].sort((a, b) => a.latency - b.latency);
  
  const working = sorted.filter(r => r.status === 'ok');
  const best = working[0] || null;
  
  if (json) {
    console.log(JSON.stringify({
      checked: results.length,
      working: working.length,
      best,
      results: sorted
    }, null, 2));
  } else {
    console.log('=== Base RPC Health Check ===\n');
    
    console.log('Results (sorted by latency):');
    sorted.forEach((r, i) => {
      const icon = r.status === 'ok' ? '✅' : '❌';
      console.log(`${icon} ${r.url}`);
      console.log(`   Latency: ${r.latency}ms${r.blockNumber ? ` | Block: ${parseInt(r.blockNumber, 16)}` : ''}`);
      if (r.error) console.log(`   Error: ${r.error}`);
      console.log('');
    });
    
    if (best) {
      console.log(`Best RPC: ${best.url} (${best.latency}ms)`);
    } else {
      console.log('⚠️ No working RPC endpoints found!');
    }
  }
}

main();
