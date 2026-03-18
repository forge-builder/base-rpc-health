# Base RPC Health Service

## Overview
A lightweight RPC health monitoring service for Base network. Provides real-time status of Base RPC endpoints with latency metrics and health scores.

## Distribution

**GitHub Repository:** https://github.com/forge-builder/base-rpc-health

## Features
- Real-time RPC health checks
- Latency measurement
- Health score calculation
- JSON API output
- Zero dependencies

## Usage
```bash
node index.js
```

## API Output
```json
{
  "status": "healthy",
  "rpc": {
    "url": "https://mainnet.base.org",
    "latency": "45ms",
    "blockHeight": 12345678
  },
  "timestamp": "2026-03-18T08:00:00Z"
}
```

## Stage
**DISTRIBUTE** - Published to GitHub

## Proof
- Repository: https://github.com/forge-builder/base-rpc-health
- Public access: Yes
- License: MIT
