#!/usr/bin/env node

/**
 * Base RPC Health + Gas Service
 * Monitors RPC endpoints AND gas prices
 */

const https = require('https');
const http = require('http');

// RPC endpoints to check
const RPC_ENDPOINTS = [
  { name: 'base.publicnode.com', url: 'https://base.publicnode.com' },
  { name: 'base.llamarpc.com', url: 'https://base.llamarpc.com' },
  { name: 'mainnet.base.org', url: 'https://mainnet.base.org' },
  { name: '1rpc.io/base', url: 'https://1rpc.io/base' },
  { name: 'rpc.ankr.com/base', url: 'https://rpc.ankr.com/base' }
];

const TIMEOUT = 10000;

/**
 * Make JSON-RPC request
 */
function makeRequest(url, method = 'eth_blockNumber') {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const start = Date.now();
    
    const req = client.post(url, {
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - start;
        try {
          const json = JSON.parse(data);
          resolve({ success: true, latency, data: json });
        } catch (e) {
          resolve({ success: false, latency, error: e.message });
        }
      });
    });
    
    req.on('error', (e) => {
      resolve({ success: false, latency: Date.now() - start, error: e.message });
    });
    
    req.write(JSON.stringify({
      jsonrpc: '2.0',
      method,
      params: [],
      id: 1
    }));
    
    req.end();
    
    setTimeout(() => {
      req.destroy();
      resolve({ success: false, latency: TIMEOUT, error: 'Timeout' });
    }, TIMEOUT);
  });
}

/**
 * Check gas price
 */
async function checkGasPrice(rpcUrl) {
  const result = await makeRequest(rpcUrl, 'eth_gasPrice');
  if (result.success) {
    const gasHex = result.data.result;
    const gasWei = parseInt(gasHex, 16);
    const gasGwei = (gasWei / 1e9).toFixed(2);
    return { success: true, gasGwei: parseFloat(gasGwei) };
  }
  return { success: false, error: result.error };
}

/**
 * Main
 */
async function main() {
  console.log('\n🔗 Base RPC Health + Gas Service');
  console.log('═══════════════════════════════════════\n');
  
  const results = [];
  
  // Check each RPC
  console.log('📡 Checking RPCs...\n');
  
  for (const endpoint of RPC_ENDPOINTS) {
    const result = await makeRequest(endpoint.url);
    if (result.success) {
      const blockHex = result.data.result;
      const blockNum = parseInt(blockHex, 16);
      results.push({ name: endpoint.name, latency: result.latency, block: blockNum, status: 'ok' });
      console.log(`✅ ${endpoint.name}: ${result.latency}ms | Block: ${blockNum}`);
    } else {
      results.push({ name: endpoint.name, latency: result.latency, error: result.error, status: 'fail' });
      console.log(`❌ ${endpoint.name}: ${result.error || 'Failed'}`);
    }
  }
  
  // Sort by latency
  results.sort((a, b) => a.latency - b.latency);
  
  // Get best RPC
  const working = results.filter(r => r.status === 'ok');
  const best = working[0];
  
  // Check gas price on best RPC
  console.log('\n⛽ Checking gas price...\n');
  let gasPrice = null;
  if (best) {
    const gas = await checkGasPrice(best.url);
    if (gas.success) {
      gasPrice = gas.gasGwei;
      console.log(`💰 Gas Price: ${gas.gasGwei} Gwei`);
    }
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log(`Best RPC: ${best ? best.name + ' (' + best.latency + 'ms)' : 'None working'}`);
  console.log(`Working: ${working.length}/${RPC_ENDPOINTS.length}`);
  if (gasPrice) console.log(`Gas: ${gasPrice} Gwei`);
  console.log('═══════════════════════════════════════\n');
  
  // Return JSON for automation
  return {
    timestamp: new Date().toISOString(),
    best: best ? { name: best.name, latency: best.latency, url: best.url } : null,
    working: working.length,
    total: RPC_ENDPOINTS.length,
    gasPrice: gasPrice,
    results: results
  };
}

main().then(console.log).catch(console.error);
