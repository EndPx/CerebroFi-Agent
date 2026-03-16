"use client";

import { useEffect, useRef, useState } from "react";

export type LogEntry = {
  timestamp: string;
  level: "info" | "warn" | "error" | "action";
  message: string;
};

export const AgentLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "System Initialized. CerebroFi Agent v1.0.0",
    },
    {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Connecting to Venice AI API for private inference...",
    },
    {
      timestamp: new Date().toISOString(),
      level: "warn",
      message: "Treasury is currently empty. Awaiting user deposit to begin yield farming.",
    },
  ]);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLogColor = (level: string) => {
    switch (level) {
      case "warn":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      case "action":
        return "text-blue-400 font-bold";
      default:
        return "text-green-400";
    }
  };

  return (
    <div className="bg-black/80 rounded-xl p-4 font-mono text-sm shadow-inner h-[250px] overflow-y-auto w-full border border-base-content/20">
      {logs.map((log, i) => (
        <div key={i} className={`mb-2 ${getLogColor(log.level)} break-words`}>
          <span className="text-gray-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
          <span>&gt;&gt;</span> {log.message}
        </div>
      ))}
      <span className="animate-pulse inline-block w-2 h-4 bg-green-500 mt-2"></span>
      <div ref={logEndRef} />
    </div>
  );
};
