"use client";

import Image from "next/image";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { AgentLog } from "~~/components/AgentLog";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

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
    args: ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
  } as any);

  const { data: wstEthBalance } = useScaffoldReadContract({
    contractName: "AutoYieldTreasury",
    functionName: "getERC20Balance" as any,
    args: ["0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452"],
  } as any);

  return (
    <div className="flex items-center flex-col grow px-5 pb-20">
      {/* Hero Section with animated logo */}
      <div className="relative w-full max-w-5xl mt-8 mb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-emerald-500/10 rounded-[2rem] blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row items-center gap-6 py-10 px-6">
          <div className="relative w-28 h-28 md:w-36 md:h-36 flex-shrink-0">
            <Image
              src="/logo-animated.gif"
              alt="CerebroFi Animated Logo"
              fill
              className="object-contain drop-shadow-[0_0_25px_rgba(0,200,255,0.4)]"
              unoptimized
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 leading-tight">
              CerebroFi Agent
            </h1>
            <p className="text-lg text-base-content/60 mt-3 max-w-xl">
              Fully autonomous AI treasury management. Powered by{" "}
              <span className="text-cyan-400 font-semibold">Venice AI</span> for private inference,{" "}
              <span className="text-blue-400 font-semibold">Uniswap</span> for swaps, and{" "}
              <span className="text-emerald-400 font-semibold">Lido</span> for staking.
            </p>
          </div>
        </div>
      </div>

      {address && (
        <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-base-200/60 border border-base-300/50 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-base-content/60 font-medium">Connected:</span>
          <Address address={address} />
        </div>
      )}

      {/* Stats Grid - Glassmorphism cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl">
        {/* ETH Card */}
        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-base-200/80 to-base-300/50 border border-base-300/60 backdrop-blur-xl p-6 shadow-lg hover:shadow-cyan-500/10 transition-all duration-500 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-colors duration-500" />
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-blue-400" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-base-content/60">Idle ETH Reserves</span>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {ethBalance !== undefined ? formatEther(ethBalance as unknown as bigint).substring(0, 8) : "0.00"} <span className="text-lg text-blue-400/60">ETH</span>
          </div>
          <div className="text-xs text-base-content/40">Awaiting optimal entry points</div>
        </div>

        {/* wstETH Card */}
        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-base-200/80 to-base-300/50 border border-base-300/60 backdrop-blur-xl p-6 shadow-lg hover:shadow-emerald-500/10 transition-all duration-500 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-emerald-500/20 transition-colors duration-500" />
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-emerald-400" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-base-content/60">Staked Yield (wstETH)</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400 mb-1">
            {wstEthBalance !== undefined ? formatEther(wstEthBalance as unknown as bigint).substring(0, 8) : "0.00"} <span className="text-lg text-emerald-400/60">wstETH</span>
          </div>
          <div className="text-xs text-base-content/40">Secured via Lido Smart Contracts</div>
        </div>

        {/* USDC Card */}
        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-base-200/80 to-base-300/50 border border-base-300/60 backdrop-blur-xl p-6 shadow-lg hover:shadow-indigo-500/10 transition-all duration-500 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-indigo-500/20 transition-colors duration-500" />
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-indigo-400" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-base-content/60">Stable Allocation (USDC)</span>
          </div>
          <div className="text-3xl font-bold text-indigo-400 mb-1">
            {usdcBalance !== undefined ? (Number(usdcBalance) / 1e6).toFixed(2) : "0.00"} <span className="text-lg text-indigo-400/60">USDC</span>
          </div>
          <div className="text-xs text-base-content/40">Risk-off capital preservation</div>
        </div>
      </div>

      {/* Protocol Badges */}
      <div className="flex flex-wrap justify-center gap-3 mt-8 w-full max-w-5xl">
        {[
          { name: "Venice AI", color: "cyan", desc: "Private Inference" },
          { name: "Uniswap V3", color: "pink", desc: "DEX Swaps" },
          { name: "Lido", color: "emerald", desc: "ETH Staking" },
          { name: "Base L2", color: "blue", desc: "Settlement" },
        ].map((p) => (
          <div key={p.name} className={`flex items-center gap-2 px-4 py-2 rounded-full bg-${p.color}-500/10 border border-${p.color}-500/20 text-${p.color}-400 text-sm font-medium`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-${p.color}-400`} />
            {p.name}
            <span className={`text-${p.color}-400/50 text-xs`}>• {p.desc}</span>
          </div>
        ))}
      </div>

      {/* Control Panel */}
      <div className="mt-10 w-full max-w-5xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-emerald-500/5 rounded-3xl blur-xl -z-10" />
        <div className="bg-base-200/60 backdrop-blur-xl rounded-3xl p-8 border border-base-300/50 shadow-xl">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">⚙️</span>
            Treasury Governance
          </h2>
          <p className="mb-6 text-base-content/50 text-sm">
            As the owner, deposit funds into the treasury. The AI Agent automatically detects idle funds and routes them for optimal yield.
          </p>

          <div className="flex flex-col md:flex-row gap-3">
            <button className="btn btn-primary btn-md flex-1 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-0 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold">
              💎 Deposit ETH
            </button>
            <button className="btn btn-md flex-1 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all border-0 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-semibold">
              💵 Deposit USDC
            </button>
            <button className="btn btn-outline btn-md flex-1 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all font-semibold">
              🚨 Emergency Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Agent Logs */}
      <div className="mt-8 w-full max-w-5xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-cyan-500/5 rounded-3xl blur-xl -z-10" />
        <div className="bg-base-200/60 backdrop-blur-xl rounded-3xl p-8 border border-base-300/50 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20">🤖</span>
            Agent Intel Log
            <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-medium bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
              </span>
              LIVE
            </span>
          </h2>
          <AgentLog />
        </div>
      </div>
    </div>
  );
};

export default Home;
