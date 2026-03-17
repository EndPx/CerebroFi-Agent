# 🧠 CerebroFi Agent

> **Fully autonomous, privacy-preserving AI treasury management on Base L2.**

CerebroFi is an autonomous AI agent that manages a crypto treasury without human intervention. It analyzes market conditions via **Venice AI** (privacy-preserving inference), then executes yield-optimizing strategies through **Uniswap V3** swaps and **Lido** staking — all on-chain on **Base L2**.

![CerebroFi Dashboard](packages/nextjs/public/logo.png)

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────┐
│                    CerebroFi Agent                    │
│                                                      │
│  ┌─────────┐    ┌──────────┐    ┌──────────────────┐ │
│  │ OBSERVE │───▶│  REASON  │───▶│       ACT        │ │
│  │         │    │          │    │                  │ │
│  │ Read    │    │ Venice   │    │ Sign + Execute   │ │
│  │ On-Chain│    │ AI API   │    │ Uniswap / Lido   │ │
│  │ State   │    │ (Private)│    │ Transactions     │ │
│  └─────────┘    └──────────┘    └──────────────────┘ │
│       ▲                                    │         │
│       └────────────── 60s Loop ────────────┘         │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────┐
         │  AutoYieldTreasury.sol    │
         │  (Base L2 Smart Contract) │
         │                           │
         │  • swapUSDCForWETH()      │
         │  • swapWETHForUSDC()      │
         │  • stakeETHToLido()       │
         │  • Owner deposit/withdraw │
         └───────────────────────────┘
```

## 🔑 Key Features

- **🤖 Fully Autonomous** — The agent runs 24/7, making yield decisions without human approval
- **🔐 Privacy-Preserving** — Uses Venice AI for encrypted LLM inference (no MEV/front-running)
- **💱 Uniswap V3 Integration** — Swaps between USDC ↔ WETH with optimal routing
- **🏦 Lido Staking** — Stakes idle ETH into wstETH for ~3.2% APY
- **🛡 Scoped Permissions** — The agent can only rebalance; it cannot withdraw funds
- **📊 Live Dashboard** — Real-time treasury monitoring with glassmorphism UI

## 🎯 Hackathon Bounties

Built for **The Synthesis Hackathon** targeting:

| Bounty | Integration |
|--------|------------|
| **Venice ($11.5K)** | Privacy-preserving AI inference for yield analysis |
| **Protocol Labs ($8K)** | Fully autonomous agent with on-chain execution |
| **Lido ($3K)** | ETH staking via wstETH |
| **Uniswap ($2.5K)** | DEX swaps via Uniswap V3 Router |

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Yarn v3
- Git

### 1. Clone & Install

```bash
git clone https://github.com/EndPx/CerebroFi-Agent.git
cd CerebroFi-Agent
yarn install
```

### 2. Generate a Wallet

```bash
yarn generate
```

### 3. Start Local Chain (with Base Fork)

```bash
yarn chain
```

### 4. Deploy Contracts

```bash
# In a new terminal
yarn deploy
```

### 5. Start Frontend Dashboard

```bash
yarn start
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Start the Agent Brain

```bash
cd packages/nextjs
cp .env.example .env.local
# Edit .env.local with your AGENT_PRIVATE_KEY and TREASURY_ADDRESS
yarn agent:start
```

## 📁 Project Structure

```
auto-yield-agent/
├── packages/
│   ├── hardhat/
│   │   ├── contracts/
│   │   │   └── AutoYieldTreasury.sol    # Core treasury contract
│   │   └── deploy/
│   │       └── 01_deploy_treasury.ts    # Deployment script
│   └── nextjs/
│       ├── agent/
│       │   └── loop.ts                  # 🧠 Autonomous agent brain
│       ├── app/
│       │   └── page.tsx                 # Dashboard UI
│       └── components/
│           ├── AgentLog.tsx             # CRT terminal agent log
│           └── Header.tsx              # Navigation with logo
```

## 🔧 Smart Contract

**`AutoYieldTreasury.sol`** — Deployed on Base L2

- **Owner Functions:** `depositERC20()`, `withdrawETH()`, `withdrawERC20()`
- **Agent Functions:** `swapUSDCForWETH()`, `swapWETHForUSDC()`, `stakeETHToLido()`
- **Security:** `onlyAgentOrOwner` modifier, `ReentrancyGuard`, `Ownable`

## 🧠 Agent Loop

The agent runs in an infinite loop with a 60-second interval:

1. **OBSERVE** — Reads ETH, USDC, WETH, wstETH balances from the treasury via viem
2. **REASON** — Sends portfolio state to Venice AI (`llama-3.3-70b`) for private analysis
3. **ACT** — Executes the recommended on-chain transaction (swap or stake)
4. **SLEEP** — Waits 60 seconds and repeats

Venice AI returns structured JSON decisions: `stake`, `swap_usdc_to_weth`, `swap_weth_to_usdc`, or `hold`.

## 🛡 Security

- Agent wallet has **scoped permissions** — can only call rebalancing functions
- Agent **cannot** withdraw funds to itself
- Owner retains full deposit/withdrawal control
- Venice AI provides **encrypted inference** — market analysis is private and MEV-resistant
- Smart contract uses OpenZeppelin's `ReentrancyGuard` and `SafeERC20`

## 🏆 Team

**CerebroFi Agent** — Built by EndPx for The Synthesis Hackathon 2026

## 📜 License

MIT