"use client";

import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { AgentLog } from "~~/components/AgentLog";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address } = useAccount();

  // Read Treasury Balances
  const { data: ethBalance } = useScaffoldReadContract({
    contractName: "AutoYieldTreasury",
    functionName: "getETHBalance" as any,
  } as any);

  const { data: usdcBalance } = useScaffoldReadContract({
    contractName: "AutoYieldTreasury",
    functionName: "getERC20Balance" as any,
    args: ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"], // Base USDC
  } as any);

  const { data: wstEthBalance } = useScaffoldReadContract({
    contractName: "AutoYieldTreasury",
    functionName: "getERC20Balance" as any,
    args: ["0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452"], // Base wstETH
  } as any);

  return (
    <div className="flex items-center flex-col grow pt-10 px-5">
      <div className="w-full max-w-4xl text-center space-y-6">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">
          CerebroFi Agent
        </h1>
        <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
          Fully autonomous AI treasury management. The agent analyzes market yields via Venice and executes via Uniswap
          & Lido.
        </p>
      </div>

      {address && (
        <div className="mt-6 flex flex-col items-center">
          <p className="text-sm font-semibold mb-1">Your Connected Wallet:</p>
          <Address address={address} />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-5xl">
        <div className="stat bg-base-200 shadow rounded-2xl border border-base-300 transform transition duration-300 hover:scale-[1.02]">
          <div className="stat-figure text-blue-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              ></path>
            </svg>
          </div>
          <div className="stat-title font-semibold">Idle ETH Reserves</div>
          <div className="stat-value text-blue-400">
            {ethBalance !== undefined ? formatEther(ethBalance as unknown as bigint).substring(0, 6) : "0.00"} ETH
          </div>
          <div className="stat-desc text-base-content/60">Awaiting optimal entry points</div>
        </div>

        <div className="stat bg-base-200 shadow rounded-2xl border border-base-300 transform transition duration-300 hover:scale-[1.02]">
          <div className="stat-figure text-emerald-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              ></path>
            </svg>
          </div>
          <div className="stat-title font-semibold">Staked Yield (wstETH)</div>
          <div className="stat-value text-emerald-400">
            {wstEthBalance !== undefined ? formatEther(wstEthBalance as unknown as bigint).substring(0, 6) : "0.00"}{" "}
            wstETH
          </div>
          <div className="stat-desc text-base-content/60">Secured via Lido Smart Contracts</div>
        </div>

        <div className="stat bg-base-200 shadow rounded-2xl border border-base-300 transform transition duration-300 hover:scale-[1.02]">
          <div className="stat-figure text-indigo-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div className="stat-title font-semibold">Stable Allocation (USDC)</div>
          <div className="stat-value text-indigo-400">
            {usdcBalance !== undefined ? (Number(usdcBalance) / 1e6).toFixed(2) : "0.00"} USDC
          </div>
          <div className="stat-desc text-base-content/60">Risk-off capital preservation</div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="mt-16 w-full max-w-5xl bg-base-300 rounded-3xl p-8 shadow-lg border border-base-200">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <span className="bg-primary text-primary-content p-2 rounded-lg">⚙️</span>
          Treasury Governance
        </h2>
        <p className="mb-6 opacity-80">
          As the owner, you can deposit funds into the treasury. The AI Agent will automatically detect idle funds and
          route them for optimal yield.
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <button className="btn btn-primary btn-lg flex-1 shadow-md hover:shadow-lg transition-all">
            Deposit ETH
          </button>
          <button className="btn btn-secondary btn-lg flex-1 shadow-md hover:shadow-lg transition-all">
            Deposit USDC
          </button>
          <button className="btn btn-outline btn-lg flex-1 border-base-content/20 hover:border-base-content/40 transition-all">
            Emergency Withdraw
          </button>
        </div>
      </div>

      {/* Agent Logs */}
      <div className="mt-12 w-full max-w-5xl bg-base-300 rounded-3xl p-8 shadow-lg border border-base-200 mb-20">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <span className="bg-neutral text-neutral-content p-2 rounded-lg">🤖</span>
          Agent Intel Log
        </h2>
        <AgentLog />
      </div>
    </div>
  );
};

export default Home;
