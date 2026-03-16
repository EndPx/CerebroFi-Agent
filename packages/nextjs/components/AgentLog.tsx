"use client";

import { useEffect, useRef, useState } from "react";

export type LogEntry = {
  timestamp: string;
  level: "info" | "warn" | "error" | "action";
  message: string;
};

const DEMO_LOGS: LogEntry[] = [
  { timestamp: new Date().toISOString(), level: "info", message: "🧠 CerebroFi Agent v1.0.0 initialized." },
  { timestamp: new Date(Date.now() + 1000).toISOString(), level: "info", message: "🔐 Connecting to Venice AI API (privacy-preserving inference)..." },
  { timestamp: new Date(Date.now() + 2000).toISOString(), level: "info", message: "✅ Venice connection established. Model: venice-llama-3.3 (encrypted)" },
  { timestamp: new Date(Date.now() + 3000).toISOString(), level: "info", message: "📡 Reading treasury balances from AutoYieldTreasury on Base L2..." },
  { timestamp: new Date(Date.now() + 4000).toISOString(), level: "warn", message: "⚠️  Treasury balance: 0 ETH, 0 USDC, 0 wstETH. Awaiting deposit." },
  { timestamp: new Date(Date.now() + 5000).toISOString(), level: "info", message: "📊 Fetching Uniswap V3 USDC/WETH pool data (0.05% fee tier)..." },
  { timestamp: new Date(Date.now() + 6000).toISOString(), level: "info", message: "📈 Lido wstETH APY: 3.2% | Uniswap USDC/ETH 24h vol: $142M" },
  { timestamp: new Date(Date.now() + 7000).toISOString(), level: "action", message: "🤖 Venice AI recommends: HOLD — volatility too high for entry." },
];

const CYCLE_LOGS: LogEntry[] = [
  { timestamp: "", level: "info", message: "⏰ Running cycle #{{n}}..." },
  { timestamp: "", level: "info", message: "📡 Querying on-chain state via Base RPC..." },
  { timestamp: "", level: "info", message: "🔐 Sending market context to Venice (encrypted)..." },
  { timestamp: "", level: "action", message: "🤖 Venice response: \"HOLD — Recommend waiting for ETH dip below ${{price}}.\"" },
  { timestamp: "", level: "info", message: "💤 Next cycle in 60s..." },
];

export const AgentLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cycleCount, setCycleCount] = useState(1);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Initial demo logs - appear one by one
  useEffect(() => {
    DEMO_LOGS.forEach((log, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, { ...log, timestamp: new Date().toISOString() }]);
      }, (i + 1) * 800);
    });
  }, []);

  // Recurring cycle logs
  useEffect(() => {
    const interval = setInterval(() => {
      setCycleCount(prev => {
        const n = prev + 1;
        const price = (2800 + Math.floor(Math.random() * 400)).toString();
        CYCLE_LOGS.forEach((log, i) => {
          setTimeout(() => {
            const msg = log.message.replace("{{n}}", n.toString()).replace("{{price}}", price);
            setLogs(prev => [...prev.slice(-50), { timestamp: new Date().toISOString(), level: log.level, message: msg }]);
          }, i * 600);
        });
        return n;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLogColor = (level: string) => {
    switch (level) {
      case "warn": return "text-amber-400";
      case "error": return "text-red-400";
      case "action": return "text-cyan-400 font-semibold";
      default: return "text-green-400/90";
    }
  };

  const getPrefix = (level: string) => {
    switch (level) {
      case "warn": return "[WARN]";
      case "error": return "[ERR!]";
      case "action": return "[EXEC]";
      default: return "[INFO]";
    }
  };

  return (
    <div className="relative">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-xl z-10 opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,0,0.1)_2px,rgba(0,255,0,0.1)_4px)]" />

      <div className="bg-[#0a0e14] rounded-xl p-5 font-mono text-xs leading-relaxed shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] h-[300px] overflow-y-auto w-full border border-green-500/10">
        {/* Terminal header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-green-500/10">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <span className="ml-3 text-green-500/40 text-[10px]">cerebrofi-agent@base ~ $</span>
        </div>

        {logs.map((log, i) => (
          <div key={i} className={`mb-1.5 ${getLogColor(log.level)} break-words`}>
            <span className="text-gray-600 mr-1.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className="text-gray-500 mr-1.5">{getPrefix(log.level)}</span>
            <span>{log.message}</span>
          </div>
        ))}

        {/* Blinking cursor */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-green-500/40">{">"}</span>
          <span className="animate-pulse inline-block w-2 h-3.5 bg-green-500/70 rounded-sm" />
        </div>
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
