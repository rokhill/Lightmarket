"use client";

import React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getMarketById, getYesPct } from "@/lib/markets";
import { statusLabel, statusColor } from "@/lib/utils";
import { placeBet, placePriceBet, requestResolution } from "@/lib/actions";
import { CHAIN, CONTRACTS } from "@/lib/constants";
import { useWallet } from "@/lib/wallet";

export default function MarketDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const marketId = Number(id);          // ← FIXED

  const router = useRouter();

  const { wallet, balance, connectWallet, txPending, setTxPending } = useWallet();

  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [predictedPrice, setPredictedPrice] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function load() {
  const m = await getMarketById();
      setMarket(m);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-500">Loading market...</p>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-500">Market not found</p>
      </div>
    );
  }

  const yesPct = (getYesPct() as any) ?? 0;
  const isResolved = market.status === 3;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">

      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-white via-[#7B61FF] to-[#A855F7] opacity-[0.15] blur-[160px]" />
        <div className="absolute top-20 right-0 h-[36rem] w-[36rem] rounded-full bg-gradient-to-bl from-white via-[#A855F7] to-[#7B61FF] opacity-[0.13] blur-[180px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <Image src="/lcai-logo.png" alt="LightMarket" width={36} height={36}
              className="drop-shadow-[0_0_12px_rgba(123,97,255,0.7)]" />
            <span className="text-lg font-bold tracking-tight">LightMarket</span>
            <span className="rounded-full border border-[#7B61FF]/40 bg-[#7B61FF]/10 px-2 py-0.5 text-[10px] font-medium text-[#7B61FF]">
              LCAI Mainnet
            </span>
          </div>

          {wallet ? (
            <div className="flex items-center gap-3 rounded-full border border-[#7B61FF]/50 bg-black/50 px-4 py-1.5 text-xs text-[#7B61FF] shadow-[0_0_14px_rgba(123,97,255,0.4)]">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
              <span>{balance} LCAI</span>
              <span className="h-3 w-px bg-[#7B61FF]/40" />
              <span className="font-mono">
                {(wallet as string).slice(0, 6)}...{(wallet as string).slice(-4)}
              </span>
            </div>
          ) : (
            <button onClick={connectWallet}
              className="rounded-full bg-gradient-to-r from-[#7B61FF] to-[#A855F7] px-5 py-2 text-xs font-bold text-white shadow-[0_0_14px_rgba(123,97,255,0.5)] hover:shadow-[0_0_22px_rgba(168,85,247,0.6)] transition-all">
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-20 pt-16">

        {/* Question */}
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">{market.question}</h1>
        <p className="text-gray-400 text-sm mb-6">{market.criteria}</p>

        {/* Status Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl mb-6">
          <div className="flex items-center gap-3 text-sm">
            <span className={`flex items-center gap-1 ${statusColor()}`}>
              ● {statusLabel()}
            </span>
            <span>Closes {market.closesAt}</span>
            <span>Pool: {market.totalPool.toFixed(1)} LCAI</span>
          </div>
        </div>

        {/* Binary Stats */}
        {market.type === "binary" && (
          <div className="flex gap-3 mb-6">
            <div className="flex-1 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{yesPct}%</p>
              <p className="text-xs text-green-400/70">YES</p>
            </div>
            <div className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{100 - yesPct}%</p>
              <p className="text-xs text-red-400/70">NO</p>
            </div>
          </div>
        )}

        {/* Resolved Banner */}
        {isResolved && (
          <div className="mb-6 rounded-xl border border-[#7B61FF]/30 bg-[#7B61FF]/10 p-4 text-xs text-[#7B61FF]">
            ⚡ Resolved by AI — Outcome: {market.outcome === 1 ? "YES" : market.outcome === 2 ? "NO" : `$${market.resolvedPrice.toFixed(4)}`}
          </div>
        )}

        {/* Betting UI */}
        {!isResolved && (
          <div className="rounded-2xl border border-[#7B61FF]/30 bg-black/40 p-5 backdrop-blur-xl">
            <p className="text-xs font-semibold text-gray-400 mb-3">Place Your Bet</p>

            {market.type === "binary" && (
              <div className="flex gap-2 mb-3">
                {["yes", "no"].map((side) => (
                  <button key={side} onClick={() => setSelectedSide(side)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-bold uppercase transition-all ${
                      selectedSide === side
                        ? side === "yes"
                          ? "border-green-500 bg-green-500/20 text-green-400"
                          : "border-red-500 bg-red-500/20 text-red-400"
                        : side === "yes"
                          ? "border-green-500/30 text-green-400/60"
                          : "border-red-500/30 text-red-400/60"
                    }`}>
                    {side}
                  </button>
                ))}
              </div>
            )}

            {market.type === "price" && (
              <input value={predictedPrice} onChange={(e) => setPredictedPrice(e.target.value)}
                placeholder="Predicted price e.g. 0.0150"
                className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-[#7B61FF]/50" />
            )}

            <input value={betAmount} onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Amount in LCAI (min 1)"
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-[#7B61FF]/50" />

            <div className="flex gap-2 mb-4">
              {[10, 50, 100, 500].map((v) => (
                <button key={v} onClick={() => setBetAmount(v.toString())}
                  className="rounded-lg border border-[#7B61FF]/30 bg-[#7B61FF]/10 px-3 py-1 text-xs text-[#7B61FF] hover:bg-[#7B61FF]/20 transition-all">
                  {v}
                </button>
              ))}
            </div>

            {!wallet && (
              <button onClick={connectWallet}
                className="w-full rounded-xl border border-[#7B61FF]/50 bg-[#7B61FF]/10 py-2.5 text-sm font-bold text-[#7B61FF] mb-3">
                Connect Wallet to Bet
              </button>
            )}

            <button
onClick={() =>
  market.type === "binary"
    ? placeBet(Number(id), selectedSide ?? "", betAmount, showToast, setTxPending)
  : placePriceBet(Number(id), Number(predictedPrice), betAmount, showToast, setTxPending)
}
              disabled={txPending}
              className="w-full rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#A855F7] py-2.5 text-sm font-bold text-white shadow-[0_0_14px_rgba(123,97,255,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all disabled:opacity-40">
              {txPending ? "Confirming..." : "Place Bet on LCAI"}
            </button>
          </div>
        )}

        {/* Request Resolution */}
        {!isResolved && market.status === 1 && (
          <div className="mt-6">
<button
  onClick={() => requestResolution(Number(id), showToast, setTxPending)}
  disabled={txPending}
  className="w-full rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#A855F7] py-2.5 text-sm font-bold text-white disabled:opacity-40"
>
  {txPending ? "Requesting..." : "Request AI Resolution"}
</button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <p className="text-[10px] text-gray-600 font-mono">
            <span className="block">LightMarket: {CONTRACTS.LightMarket}</span>
            <span className="block">AIResolver: {CONTRACTS.AIResolver}</span>
            <span className="block">MarketFactory: {CONTRACTS.MarketFactory}</span>
          </p>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg z-50 ${
          toastType === "error" ? "bg-red-500/90" : "bg-green-500/90"
        }`}>
          {toastType === "error" ? "✗" : "✓"} {toast}
        </div>
      )}
    </div>
  );
}
