/**
 * CerebroFi Agent – Autonomous Treasury Brain
 *
 * This script runs as a standalone Node.js process and performs an infinite loop:
 *   1. OBSERVE  – Read ETH, USDC, wstETH balances from AutoYieldTreasury on-chain
 *   2. REASON   – Send market context to Venice AI (privacy-preserving LLM) for a decision
 *   3. ACT      – Execute the recommended on-chain action (swap, stake, or hold)
 *   4. SLEEP    – Wait 60 seconds and repeat
 *
 * Usage:
 *   npx ts-node --esm agent/loop.ts
 *
 * Required env vars (in packages/nextjs/.env.local):
 *   AGENT_PRIVATE_KEY   – The agent's wallet private key
 *   SYNTHESIS_API_KEY   – Venice / Synthesis hackathon API key
 *   TREASURY_ADDRESS    – Deployed AutoYieldTreasury contract address
 *   BASE_RPC_URL        – (optional) defaults to https://mainnet.base.org
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  parseEther,
  parseUnits,
  type Hex,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// =============================================
// Configuration
// =============================================

const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY as Hex;
const SYNTHESIS_API_KEY = process.env.SYNTHESIS_API_KEY || "";
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS as Address;
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const CYCLE_INTERVAL_MS = 60_000; // 60 seconds between cycles

// Venice AI endpoint (OpenAI-compatible)
const VENICE_API_URL = "https://api.venice.ai/api/v1/chat/completions";
const VENICE_MODEL = "llama-3.3-70b";

// Base Mainnet Token Addresses
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address;
const WETH = "0x4200000000000000000000000000000000000006" as Address;
const WSTETH = "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452" as Address;

// Minimal ERC-20 ABI for balance reads
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// AutoYieldTreasury ABI (agent functions only)
const TREASURY_ABI = [
  {
    name: "swapUSDCForWETH",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "swapWETHForUSDC",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "stakeETHToLido",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amountETH", type: "uint256" }],
    outputs: [],
  },
  {
    name: "agent",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

// =============================================
// Viem Clients
// =============================================

const account = AGENT_PRIVATE_KEY ? privateKeyToAccount(AGENT_PRIVATE_KEY) : null;

const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});

const walletClient = account
  ? createWalletClient({
      account,
      chain: base,
      transport: http(BASE_RPC_URL),
    })
  : null;

// =============================================
// Helper: Pretty log with timestamp
// =============================================

function log(level: "INFO" | "WARN" | "EXEC" | "ERR!", message: string) {
  const ts = new Date().toISOString();
  const colors: Record<string, string> = {
    INFO: "\x1b[32m",
    WARN: "\x1b[33m",
    "EXEC": "\x1b[36m",
    "ERR!": "\x1b[31m",
  };
  const reset = "\x1b[0m";
  console.log(`${colors[level]}[${ts}] [${level}]${reset} ${message}`);
}

// =============================================
// Step 1: OBSERVE – Read on-chain balances
// =============================================

interface TreasuryState {
  ethBalance: bigint;
  usdcBalance: bigint;
  wstEthBalance: bigint;
  wethBalance: bigint;
}

async function observeTreasury(): Promise<TreasuryState> {
  log("INFO", "📡 Reading treasury balances from Base L2...");

  const [ethBalance, usdcBalance, wstEthBalance, wethBalance] = await Promise.all([
    publicClient.getBalance({ address: TREASURY_ADDRESS }),
    publicClient.readContract({
      address: USDC,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [TREASURY_ADDRESS],
    }),
    publicClient.readContract({
      address: WSTETH,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [TREASURY_ADDRESS],
    }),
    publicClient.readContract({
      address: WETH,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [TREASURY_ADDRESS],
    }),
  ]);

  log("INFO", `   ETH:    ${formatEther(ethBalance)} ETH`);
  log("INFO", `   USDC:   ${(Number(usdcBalance) / 1e6).toFixed(2)} USDC`);
  log("INFO", `   wstETH: ${formatEther(wstEthBalance)} wstETH`);
  log("INFO", `   WETH:   ${formatEther(wethBalance)} WETH`);

  return { ethBalance, usdcBalance, wstEthBalance, wethBalance };
}

// =============================================
// Step 2: REASON – Query Venice AI for decision
// =============================================

type AgentAction = "stake" | "swap_usdc_to_weth" | "swap_weth_to_usdc" | "hold";

interface VeniceDecision {
  action: AgentAction;
  reason: string;
  amount_pct: number; // percentage of available balance to use (0-100)
}

async function queryVenice(state: TreasuryState): Promise<VeniceDecision> {
  log("INFO", "🔐 Sending market context to Venice AI (encrypted inference)...");

  const ethStr = formatEther(state.ethBalance);
  const usdcStr = (Number(state.usdcBalance) / 1e6).toFixed(2);
  const wstEthStr = formatEther(state.wstEthBalance);
  const wethStr = formatEther(state.wethBalance);

  const systemPrompt = `You are CerebroFi, an autonomous AI treasury agent managing a crypto portfolio on Base L2.

Your ONLY available actions are:
1. "stake" – Stake idle ETH into Lido to earn wstETH yield (~3.2% APY)
2. "swap_usdc_to_weth" – Swap USDC for WETH via Uniswap V3 (bullish on ETH)
3. "swap_weth_to_usdc" – Swap WETH for USDC via Uniswap V3 (de-risk / bearish)
4. "hold" – Do nothing this cycle

IMPORTANT RULES:
- If the treasury is empty (all balances are 0), you MUST return "hold".
- If ETH balance is > 0.01 ETH and wstETH balance is low, consider staking.
- Be conservative. Never use more than 50% of any single asset per cycle.
- Always explain your reasoning briefly.

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{"action": "hold", "reason": "brief explanation", "amount_pct": 0}`;

  const userPrompt = `Current treasury state on Base L2:
- ETH: ${ethStr} ETH
- USDC: ${usdcStr} USDC  
- WETH: ${wethStr} WETH
- wstETH: ${wstEthStr} wstETH

Current market context:
- Lido wstETH APY: ~3.2%
- ETH 30-day trend: ranging

What action should I take?`;

  try {
    const response = await fetch(VENICE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SYNTHESIS_API_KEY}`,
      },
      body: JSON.stringify({
        model: VENICE_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Venice API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) throw new Error("Empty response from Venice");

    // Parse JSON from Venice response (handle possible markdown wrapping)
    let jsonStr = content;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }

    const decision: VeniceDecision = JSON.parse(jsonStr);
    log("EXEC", `🤖 Venice Decision: ${decision.action.toUpperCase()} — "${decision.reason}"`);
    return decision;
  } catch (err: any) {
    log("ERR!", `Venice query failed: ${err.message}`);
    return { action: "hold", reason: "Venice unavailable, defaulting to hold", amount_pct: 0 };
  }
}

// =============================================
// Step 3: ACT – Execute on-chain transaction
// =============================================

async function executeAction(decision: VeniceDecision, state: TreasuryState): Promise<void> {
  if (decision.action === "hold") {
    log("INFO", "💤 HOLD — No action taken this cycle.");
    return;
  }

  if (!walletClient) {
    log("WARN", "⚠️  No AGENT_PRIVATE_KEY set — skipping execution (dry run mode).");
    return;
  }

  const pct = Math.min(decision.amount_pct, 50) / 100; // Cap at 50%

  try {
    if (decision.action === "stake" && state.ethBalance > 0n) {
      const amount = (state.ethBalance * BigInt(Math.floor(pct * 100))) / 100n;
      if (amount === 0n) {
        log("WARN", "⚠️  Calculated stake amount is 0, skipping.");
        return;
      }

      log("EXEC", `🏦 Staking ${formatEther(amount)} ETH to Lido via treasury...`);
      const hash = await walletClient.writeContract({
        address: TREASURY_ADDRESS,
        abi: TREASURY_ABI,
        functionName: "stakeETHToLido",
        args: [amount],
      });
      log("EXEC", `✅ TX submitted: ${hash}`);
    } else if (decision.action === "swap_usdc_to_weth" && state.usdcBalance > 0n) {
      const amount = (state.usdcBalance * BigInt(Math.floor(pct * 100))) / 100n;
      if (amount === 0n) {
        log("WARN", "⚠️  Calculated swap amount is 0, skipping.");
        return;
      }

      log("EXEC", `💱 Swapping ${(Number(amount) / 1e6).toFixed(2)} USDC → WETH via Uniswap V3...`);
      const hash = await walletClient.writeContract({
        address: TREASURY_ADDRESS,
        abi: TREASURY_ABI,
        functionName: "swapUSDCForWETH",
        args: [amount, 0n], // 0 slippage protection for demo
      });
      log("EXEC", `✅ TX submitted: ${hash}`);
    } else if (decision.action === "swap_weth_to_usdc" && state.wethBalance > 0n) {
      const amount = (state.wethBalance * BigInt(Math.floor(pct * 100))) / 100n;
      if (amount === 0n) {
        log("WARN", "⚠️  Calculated swap amount is 0, skipping.");
        return;
      }

      log("EXEC", `💱 Swapping ${formatEther(amount)} WETH → USDC via Uniswap V3...`);
      const hash = await walletClient.writeContract({
        address: TREASURY_ADDRESS,
        abi: TREASURY_ABI,
        functionName: "swapWETHForUSDC",
        args: [amount, 0n],
      });
      log("EXEC", `✅ TX submitted: ${hash}`);
    } else {
      log("WARN", `⚠️  Action "${decision.action}" has no available balance to act on.`);
    }
  } catch (err: any) {
    log("ERR!", `Transaction failed: ${err.message}`);
  }
}

// =============================================
// Main Loop
// =============================================

async function runCycle(cycleNum: number) {
  log("INFO", `\n${"=".repeat(60)}`);
  log("INFO", `⏰ CerebroFi Agent — Cycle #${cycleNum}`);
  log("INFO", `${"=".repeat(60)}`);

  // 1. Observe
  const state = await observeTreasury();

  // 2. Reason
  const decision = await queryVenice(state);

  // 3. Act
  await executeAction(decision, state);
}

async function main() {
  console.log(`
   ██████╗███████╗██████╗ ███████╗██████╗ ██████╗ ███████╗██╗
  ██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██║
  ██║     █████╗  ██████╔╝█████╗  ██████╔╝██║  ██║█████╗  ██║
  ██║     ██╔══╝  ██╔══██╗██╔══╝  ██╔══██╗██║  ██║██╔══╝  ██║
  ╚██████╗███████╗██║  ██║███████╗██████╔╝██████╔╝██║     ██║
   ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚═════╝ ╚═╝     ╚═╝
  `);
  log("INFO", "🧠 CerebroFi Agent v1.0.0 starting...");
  log("INFO", `   Agent Wallet: ${account?.address || "DRY RUN (no private key)"}`);
  log("INFO", `   Treasury:     ${TREASURY_ADDRESS || "NOT SET"}`);
  log("INFO", `   RPC:          ${BASE_RPC_URL}`);
  log("INFO", `   Venice Model: ${VENICE_MODEL}`);
  log("INFO", `   Cycle Interval: ${CYCLE_INTERVAL_MS / 1000}s`);

  if (!TREASURY_ADDRESS) {
    log("ERR!", "TREASURY_ADDRESS not set! Set it in .env.local and restart.");
    process.exit(1);
  }

  let cycle = 0;
  while (true) {
    cycle++;
    try {
      await runCycle(cycle);
    } catch (err: any) {
      log("ERR!", `Cycle #${cycle} crashed: ${err.message}`);
    }
    log("INFO", `💤 Sleeping ${CYCLE_INTERVAL_MS / 1000}s until next cycle...`);
    await new Promise(resolve => setTimeout(resolve, CYCLE_INTERVAL_MS));
  }
}

main().catch(err => {
  log("ERR!", `Fatal error: ${err.message}`);
  process.exit(1);
});
