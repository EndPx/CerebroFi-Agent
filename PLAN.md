# Implementation Plan: Auto-Yield Treasury Agent

This document outlines the technical architecture and execution steps for building the Auto-Yield Treasury Agent for The Synthesis Hackathon.

## Goal Description

We want to build an autonomous, privacy-preserving AI agent that manages a crypto treasury. The agent will autonomously monitor stablecoin yields and Lido staking rates, use Venice's API securely off-chain to determine whether to rebalance, and then execute swaps via Uniswap and staking via Lido entirely on-chain. 

We are targeting the **Protocol Labs ($8K)**, **Venice ($11.5K)**, **Lido ($3K)**, and **Uniswap ($2.5K)** bounties.

## Architecture 

The application uses the **Scaffold-ETH 2 (Hardhat Flavor)** generated in the `auto-yield-agent` directory.

### 1. The Smart Contract (`packages/hardhat/contracts/AutoYieldTreasury.sol`)
The on-chain component where funds are held. The AI Agent's wallet identity is granted specific authority over this contract.
*   **Scoped Permissions:** The agent can only call `executeRebalance()`. It cannot withdraw funds to itself.
*   **Uniswap Integration:** Natively interfaces with the Uniswap V3 Router to swap between USDC and ETH. 
*   **Lido Integration:** Can call Lido's `submit()` to stake ETH and receive `wstETH`. 
*   **Owner Capabilities:** The human owner can deposit/withdraw funds at any time.

### 2. The Agent Logic (`packages/nextjs/agent/loop.ts`)
The off-chain brain, running as a secure Node.js process.
*   **Observation:** Fetches the current exact balances from our treasury contract on Base via wagmi/viem.
*   **Reasoning (Venice):** It takes current market volatility, Uniswap pool yields, and Lido staking yields, and sends it to Venice's API. The LLM prompts return a decisive action ("stake", "swap", "hold").
*   **Execution (Protocol Labs track):** The agent signs the transaction using its own private key and pays its own gas to call `executeRebalance()` on our contract. No human approval is needed.

### 3. The Frontend (`packages/nextjs/app/page.tsx`)
A minimal, beautiful web3 dashboard built with Next.js, Tailwind, and DaisyUI.
*   **Dashboard:** Shows the total TVL of the treasury, current asset allocation, and a deposit/withdraw UI for the human.
*   **Agent Log:** A live feed displaying the agent's recent thoughts (from Venice) and executed on-chain transactions.

## Proposed Steps

1.  **Environment Setup**: Install Hardhat, set up `.env` for RPCs and Wallets.
2.  **Smart Contract Dev**: Write `AutoYieldTreasury.sol` and interfaces for Uniswap/Lido.
3.  **Local Testing**: Run a local fork (`yarn chain`) of Base/Mainnet. Run tests.
4.  **Agent Dev**: Write the off-chain `loop.ts` in Node that queries Venice and calls the contract.
5.  **Frontend Dev**: Build out `page.tsx` for the human user to interact with the treasury.
6.  **Production Deployment**: Deploy the contract to Base, run the Agent on a cloud server, deploy the NextJS app.
