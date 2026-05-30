"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  getProvider,
  getSigner,
  getLightMarket,
  getMarketFactory,
  switchToLCAI,
  formatLCAI,
  parseLCAI,
  CHAIN,
  CONTRACTS,
} from "../lib/contracts";

export default function Home() {
  const [activeTab, setActiveTab] = useState("browse");
  const [browseFilter, setBrowseFilter] = useState("open");
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMarket, setActiveMarket] = useState<number | null>(null);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [predictedPrice, setPredictedPrice] = useState("");
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [claimedMarkets, setClaimedMarkets] = useState<Set<number>>(new Set());
  const [pendingWinnings, setPendingWinnings] = useState<any>(0);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");
  const [mktType, setMktType] = useState("binary");
  const [mktQuestion, setMktQuestion] = useState("");
  const [mktCriteria, setMktCriteria] = useState("");
  const [txPending, setTxPending] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const showToast = (msg: string, type = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 4000);
  };

  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        showToast("MetaMask not found. Please install it.", "error");
        return;
      }
      await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      await switchToLCAI();
      const provider = await getProvider();
      const signer = await (provider as ethers.BrowserProvider).getSigner();
      const address = await signer.getAddress();
      const bal = await provider.getBalance(address);
      setWallet(address);
      setBalance(formatLCAI(bal));
      showToast("Wallet connected!");
      loadMarkets();
      loadMyBets(address);
      loadPendingWinnings(address);
    } catch (err: any) {
      showToast(err.message || "Failed to connect wallet", "error");
    }
  };

  const loadPendingWinnings = async (address: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(CHAIN.rpc);
      const contract = getLightMarket(provider);
      const pending = await contract.pendingWithdrawals(address);
      setPendingWinnings(pending);
      if (pending > 0) showToast(`You have ${formatLCAI(pending)} LCAI to claim!`);
    } catch {}
  };

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider(CHAIN.rpc);
      const contract = getLightMarket(provider);
      const count = await contract.marketCount();
      const loaded = [];
      for (let i = 0; i < Number(count); i++) {
        try {
          const m = await contract.getMarket(i);
          loaded.push({
            id: Number(m.id),
            question: m.question,
            criteria: m.resolutionCriteria,
            type: Number(m.marketType) === 0 ? "binary" : "price",
            status: Number(m.status),
            yesPool: parseFloat(ethers.formatEther(m.yesPool)),
            noPool: parseFloat(ethers.formatEther(m.noPool)),
            totalPool: parseFloat(ethers.formatEther(m.totalPool)),
            closesAt: new Date(Number(m.closesAt) * 1000).toLocaleDateString(),
            closesAtTs: Number(m.closesAt),
            resolvesAt: Number(m.resolvesAt),
            creator: m.creator,
            outcome: Number(m.binaryOutcome),
            resolvedPrice: parseFloat(ethers.formatEther(m.resolvedPrice)),
          });
        } catch {}
      }
      setMarkets(loaded);
    } catch {
      showToast("Could not load markets", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadMyBets = async (userAddress: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(CHAIN.rpc);
      const contract = getLightMarket(provider);
      const filter = contract.filters.BetPlaced(null, userAddress);
      const events = await contract.queryFilter(filter, 0, "latest");
      const bets = events.map((e: any) => ({
        marketId: Number(e.args.marketId),
        question: `Market #${e.args.marketId}`,
        side: e.args.isYes ? "YES" : e.args.predictedPrice > 0 ? `$${parseFloat(ethers.formatEther(e.args.predictedPrice)).toFixed(4)}` : "NO",
        isYes: e.args.isYes,
        amount: parseFloat(ethers.formatEther(e.args.amount)),
        txHash: e.transactionHash,
      }));
      setPortfolio(bets);
    } catch {}
  };

  useEffect(() => { loadMarkets(); }, []);

  const getYesPct = (m: any) => m.totalPool === 0 ? 50 : Math.round((m.yesPool / m.totalPool) * 100);

  const getUserBetOnMarket = (marketId: number) => portfolio.find(p => p.marketId === marketId);

  const didUserWin = (market: any) => {
    const bet = getUserBetOnMarket(market.id);
    if (!bet || market.status !== 3) return null;
    if (market.type === "binary") {
      if (market.outcome === 1 && bet.isYes) return true;
      if (market.outcome === 2 && !bet.isYes) return true;
      return false;
    }
    return null;
  };

  const placeBet = async (i: number) => {
    if (!wallet) { showToast("Connect wallet first", "error"); return; }
    if (!selectedSide) { showToast("Select YES or NO", "error"); return; }
    const amt = parseFloat(betAmount);
    if (!amt || amt < 1) { showToast("Minimum bet is 1 LCAI", "error"); return; }
    if (isNaN(amt)) { showToast("Invalid bet amount", "error"); return; }
    try {
      setTxPending(true);
      const signer = await getSigner();
      const contract = getLightMarket(signer);
      const tx = await contract.placeBinaryBet(markets[i].id, selectedSide === "yes", { value: parseLCAI(betAmount) });
      showToast("Transaction submitted...");
      await tx.wait();
      showToast(`Bet placed: ${amt} LCAI on ${selectedSide.toUpperCase()}`);
      setPortfolio([...portfolio, { marketId: markets[i].id, question: markets[i].question, side: selectedSide.toUpperCase(), isYes: selectedSide === "yes", amount: amt, txHash: tx.hash }]);
      setActiveMarket(null);
      setSelectedSide(null);
      setBetAmount("");
      loadMarkets();
    } catch (err: any) {
      showToast(err.reason || err.message || "Transaction failed", "error");
    } finally {
      setTxPending(false);
    }
  };

  const placePriceBet = async (i: number) => {
    if (!wallet) { showToast("Connect wallet first", "error"); return; }
    if (!predictedPrice || isNaN(Number(predictedPrice)) || Number(predictedPrice) <= 0) { showToast("Enter a valid price e.g. 0.005", "error"); return; }
    if (predictedPrice.split(".")[1]?.length > 18) { showToast("Max 18 decimal places", "error"); return; }
    const amt = parseFloat(betAmount);
    if (!amt || amt < 1) { showToast("Minimum bet is 1 LCAI", "error"); return; }
    try {
      setTxPending(true);
      const signer = await getSigner();
      const contract = getLightMarket(signer);
      const priceWei = ethers.parseEther(predictedPrice.trim());
      const tx = await contract.placePriceBet(markets[i].id, priceWei, { value: parseLCAI(betAmount) });
      showToast("Transaction submitted...");
      await tx.wait();
      showToast(`Prediction: $${Number(predictedPrice).toFixed(4)} with ${amt} LCAI`);
      setPortfolio([...portfolio, { marketId: markets[i].id, question: markets[i].question, side: `$${Number(predictedPrice).toFixed(4)}`, isYes: false, amount: amt, txHash: tx.hash }]);
      setActiveMarket(null);
      setBetAmount("");
      setPredictedPrice("");
      loadMarkets();
    } catch (err: any) {
      showToast(err.reason || err.message || "Transaction failed", "error");
    } finally {
      setTxPending(false);
    }
  };

  const claimWinnings = async (marketId: number) => {
    if (!wallet) { showToast("Connect wallet first", "error"); return; }
    try {
      setTxPending(true);
      const signer = await getSigner();
      const contract = getLightMarket(signer);
      const tx = await contract.claimBinaryWinnings(marketId);
      showToast("Claiming winnings...");
      await tx.wait();
      const tx2 = await contract.withdraw();
      await tx2.wait();
      showToast("Winnings claimed!");
      setClaimedMarkets(prev => new Set([...prev, marketId]));
      loadPendingWinnings(wallet);
      loadMarkets();
    } catch (err: any) {
      showToast(err.reason || err.message || "Claim failed", "error");
    } finally {
      setTxPending(false);
    }
  };

  const createMarket = async () => {
    if (!wallet) { showToast("Connect wallet first", "error"); return; }
    if (!mktQuestion.trim()) { showToast("Enter a market question", "error"); return; }
    if (!mktCriteria.trim()) { showToast("Enter resolution criteria", "error"); return; }
    if (!endDate || !endTime) { showToast("Select end date and time", "error"); return; }
    try {
      setTxPending(true);
      const signer = await getSigner();
      const contract = getLightMarket(signer);
      const now = Math.floor(Date.now() / 1000);
      const closesAt = Math.floor(new Date(`${endDate}T${endTime}`).getTime() / 1000);
      if (closesAt <= now) { showToast("End time must be in the future", "error"); return; }
      const resolvesAt = closesAt + 3600;
      let tx;
      if (mktType === "binary") {
        tx = await contract.createBinaryMarket(mktQuestion, mktCriteria, 0, closesAt, resolvesAt, 50);
      } else {
        tx = await contract.createPricePredictionMarket(mktQuestion, mktCriteria, closesAt, resolvesAt, 50);
      }
      showToast("Deploying market...");
      await tx.wait();
      showToast("Market deployed on LCAI mainnet!");
      setMktQuestion("");
      setMktCriteria("");
      setEndDate("");
      setEndTime("");
      setActiveTab("browse");
      loadMarkets();
    } catch (err: any) {
      showToast(err.reason || err.message || "Transaction failed", "error");
    } finally {
      setTxPending(false);
    }
  };

  const statusLabel = (s: number) => ["Open","Closed","Resolving","Resolved","Cancelled"][s] || "Unknown";
  const statusColor = (s: number) => s === 0 ? "text-green-400" : s === 3 ? "text-purple-400" : s === 4 ? "text-red-400" : "text-yellow-400";

  const openMarkets = markets.filter(m => m.status === 0);
  const closedMarkets = markets.filter(m => m.status !== 0);

  const portfolioWithStatus = portfolio.map(p => {
    const market = markets.find(m => m.id === p.marketId);
    const won = market ? didUserWin(market) : null;
    const claimed = claimedMarkets.has(p.marketId);
    return { ...p, market, won, claimed, resolved: market?.status === 3 };
  });

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-white via-[#7B61FF] to-[#A855F7] opacity-[0.15] blur-[160px]" />
        <div className="absolute top-20 right-0 h-[36rem] w-[36rem] rounded-full bg-gradient-to-bl from-white via-[#A855F7] to-[#7B61FF] opacity-[0.13] blur-[180px]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Image src="/lcai-logo.png" alt="LightMarket" width={36} height={36} className="drop-shadow-[0_0_12px_rgba(123,97,255,0.7)]" priority />
            <span className="text-lg font-bold tracking-tight">LightMarket</span>
            <span className="rounded-full border border-[#7B61FF]/40 bg-[#7B61FF]/10 px-2 py-0.5 text-[10px] font-medium text-[#7B61FF]">LCAI Mainnet</span>
          </div>
          <div className="flex items-center gap-3">
            {pendingWinnings > 0 && (
              <span className="text-xs text-green-400 font-semibold animate-pulse">{formatLCAI(pendingWinnings)} LCAI unclaimed</span>
            )}
            {wallet ? (
              <div className="flex items-center gap-3 rounded-full border border-[#7B61FF]/50 bg-black/50 px-4 py-1.5 text-xs text-[#7B61FF] shadow-[0_0_14px_rgba(123,97,255,0.4)]">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span>{balance} LCAI</span>
                <span className="h-3 w-px bg-[#7B61FF]/40" />
                <span className="font-mono">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
              </div>
            ) : (
              <button onClick={connectWallet} className="rounded-full bg-gradient-to-r from-[#7B61FF] to-[#A855F7] px-5 py-2 text-xs font-bold text-white shadow-[0_0_14px_rgba(123,97,255,0.5)] hover:shadow-[0_0_22px_rgba(168,85,247,0.6)] transition-all">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-16">
        <section className="mb-16 text-center">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[26rem] w-[26rem] rounded-full bg-gradient-to-b from-white via-[#7B61FF] to-[#A855F7] opacity-[0.18] blur-[200px] pointer-events-none" />
          <h1 className="relative text-6xl font-extrabold tracking-tight">Predict the Future</h1>
          <p className="relative mt-3 bg-gradient-to-r from-[#7B61FF] to-[#A855F7] bg-clip-text text-3xl font-bold text-transparent">Verified by AI</p>
          <p className="relative mt-5 mx-auto max-w-xl text-sm text-gray-400 leading-relaxed">The first AI-native prediction market on LightchainAI. Every outcome resolved by verifiable on-chain inference.</p>
          <div className="relative mt-8 flex justify-center gap-4">
            <button onClick={() => setActiveTab("create")} className="rounded-full bg-gradient-to-r from-[#7B61FF] to-[#A855F7] px-8 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(123,97,255,0.55)] transition-all">Create Market</button>
            <button onClick={() => setActiveTab("browse")} className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold text-white hover:border-white/40 transition-all">Browse Markets</button>
          </div>
        </section>

        <div className="mb-10 grid grid-cols-3 gap-4">
          {[
            { label: "Open Markets", value: openMarkets.length.toString() },
            { label: "Total Volume", value: markets.reduce((a, m) => a + m.totalPool, 0).toFixed(1) + " LCAI" },
            { label: "AI Resolved", value: closedMarkets.filter(m => m.status === 3).length.toString() },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-2xl font-bold bg-gradient-to-r from-[#7B61FF] to-[#A855F7] bg-clip-text text-transparent">{s.value}</p>
              <p className="mt-1 text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold">Markets</h2>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {["browse", "portfolio", "create"].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all ${activeTab === t ? "bg-gradient-to-r from-[#7B61FF] to-[#A855F7] text-white" : "text-gray-400 hover:text-white"}`}>
                {t === "create" ? "+ Create" : t === "portfolio" ? "My Bets" : "Browse"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "browse" && (
          <div>
            <div className="flex gap-2 mb-6">
              {["open", "closed"].map(f => (
                <button key={f} onClick={() => setBrowseFilter(f)} className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all border ${browseFilter === f ? "border-[#7B61FF] bg-[#7B61FF]/20 text-[#7B61FF]" : "border-white/10 text-gray-400 hover:text-white"}`}>
                  {f === "open" ? `Open (${openMarkets.length})` : `Resolved (${closedMarkets.length})`}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {loading && <p className="text-center text-gray-500 py-10">Loading markets...</p>}
              {(browseFilter === "open" ? openMarkets : closedMarkets).map((m, idx) => {
                const i = markets.findIndex(mk => mk.id === m.id);
                const yesPct = getYesPct(m);
                const isActive = activeMarket === m.id;
                const isResolved = m.status === 3;
                const userBet = getUserBetOnMarket(m.id);
                const won = didUserWin(m);
                const claimed = claimedMarkets.has(m.id);

                return (
                  <div key={m.id} onClick={() => { setActiveMarket(isActive ? null : m.id); setSelectedSide(null); }}
                    className={`rounded-2xl border bg-white/5 p-5 backdrop-blur-xl cursor-pointer transition-all ${isActive ? "border-[#7B61FF]/60 shadow-[0_0_20px_rgba(123,97,255,0.25)]" : "border-white/10 hover:border-white/20"}`}>

                    <div className="flex items-start justify-between gap-3 mb-4">
                      <p className="text-sm font-semibold leading-snug">{m.question}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.type === "binary" ? "bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30" : "bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30"}`}>
                        {m.type === "binary" ? "Yes / No" : "Price"}
                      </span>
                    </div>

                    {userBet && (
                      <div className={`mb-3 rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-between ${won === true ? "border-green-500/40 bg-green-500/10 text-green-400" : won === false ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-white/10 bg-white/5 text-gray-400"}`}>
                        <span>Your bet: {userBet.amount} LCAI on {userBet.side}</span>
                        <span>{won === true ? "🏆 Won!" : won === false ? "❌ Lost" : "⏳ Pending"}</span>
                      </div>
                    )}

                    {m.type === "binary" && !isResolved && (
                      <>
                        <div className="flex gap-3 mb-3">
                          <button onClick={(e) => { e.stopPropagation(); setActiveMarket(m.id); setSelectedSide("yes"); }} className="flex-1 rounded-xl border border-green-500/30 bg-green-500/10 py-2.5 text-center transition-all hover:bg-green-500/20">
                            <p className="text-lg font-bold text-green-400">{yesPct}%</p>
                            <p className="text-[10px] text-green-400/70">YES</p>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setActiveMarket(m.id); setSelectedSide("no"); }} className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-center transition-all hover:bg-red-500/20">
                            <p className="text-lg font-bold text-red-400">{100 - yesPct}%</p>
                            <p className="text-[10px] text-red-400/70">NO</p>
                          </button>
                        </div>
                        <div className="h-1 rounded-full bg-white/10 overflow-hidden flex mb-3">
                          <div className="bg-green-500 transition-all" style={{ width: `${yesPct}%` }} />
                          <div className="bg-red-500 flex-1" />
                        </div>
                      </>
                    )}

                    {isResolved && (
                      <div className="mb-3 rounded-xl border border-[#7B61FF]/30 bg-[#7B61FF]/10 p-3 text-xs text-[#7B61FF] flex items-center justify-between">
                        <span>⚡ AI Resolved — Outcome: {m.outcome === 1 ? "YES ✅" : m.outcome === 2 ? "NO ❌" : `$${m.resolvedPrice.toFixed(4)}`}</span>
                        <span className="text-gray-400">Pool: {m.totalPool.toFixed(1)} LCAI</span>
                      </div>
                    )}

                    {isResolved && userBet && won === true && !claimed && (
                      <button onClick={(e) => { e.stopPropagation(); claimWinnings(m.id); }} disabled={txPending}
                        className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-2.5 text-sm font-bold text-white mb-3 disabled:opacity-40 transition-all">
                        {txPending ? "Claiming..." : "🏆 Claim Winnings"}
                      </button>
                    )}

                    {isResolved && userBet && won === true && claimed && (
                      <div className="w-full rounded-xl border border-green-500/30 bg-green-500/10 py-2.5 text-sm font-bold text-green-400 text-center mb-3">
                        ✅ Winnings Claimed
                      </div>
                    )}

                    {isResolved && userBet && won === false && (
                      <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-bold text-red-400 text-center mb-3">
                        ❌ Better luck next time
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-gray-500">
                      <span className={`flex items-center gap-1 ${statusColor(m.status)}`}>● {statusLabel(m.status)}</span>
                      <span>Closes {m.closesAt}</span>
                      <span>Pool: {m.totalPool.toFixed(1)} LCAI</span>
                      <span className="ml-auto flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-green-400">⚡ AI</span>
                    </div>

                    {isActive && m.status === 0 && (
                      <div onClick={(e) => e.stopPropagation()} className="mt-4 rounded-xl border border-[#7B61FF]/30 bg-black/40 p-4">
                        <p className="text-xs font-semibold text-gray-400 mb-3">Place Your Bet</p>

                        {m.type === "binary" && (
                          <div className="flex gap-2 mb-3">
                            {["yes", "no"].map((side) => (
                              <button key={side} onClick={() => setSelectedSide(side)}
                                className={`flex-1 rounded-xl border py-2 text-xs font-bold uppercase transition-all ${selectedSide === side ? (side === "yes" ? "border-green-500 bg-green-500/20 text-green-400" : "border-red-500 bg-red-500/20 text-red-400") : (side === "yes" ? "border-green-500/30 text-green-400/60" : "border-red-500/30 text-red-400/60")}`}>
                                {side}
                              </button>
                            ))}
                          </div>
                        )}

                        {m.type === "price" && (
                          <input value={predictedPrice} onChange={(e) => setPredictedPrice(e.target.value)}
                            placeholder="Your price prediction e.g. 0.0050"
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

                        <button onClick={() => m.type === "binary" ? placeBet(i) : placePriceBet(i)} disabled={txPending}
                          className="w-full rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#A855F7] py-2.5 text-sm font-bold text-white disabled:opacity-40 transition-all">
                          {txPending ? "Confirming..." : "Place Bet on LCAI"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "portfolio" && (
          <div>
            {portfolioWithStatus.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-4xl mb-4">🎯</p>
                <p>No bets yet — go make some predictions!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {portfolioWithStatus.map((p, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-2xl border p-4 ${p.won === true ? "border-green-500/30 bg-green-500/5" : p.won === false ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/5"}`}>
                    <div>
                      <p className="text-sm font-medium">{p.question}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {p.amount} LCAI on <span className={`font-semibold ${p.side === "YES" ? "text-green-400" : p.side === "NO" ? "text-red-400" : "text-[#A855F7]"}`}>{p.side}</span>
                      </p>
                      {p.txHash && (
                        <a href={`${CHAIN.explorer}/tx/${p.txHash}`} target="_blank" rel="noreferrer" className="text-[10px] text-[#7B61FF] hover:underline mt-1 block">View on explorer ↗</a>
                      )}
                    </div>
                    <div className="text-right">
                      {p.won === true && !p.claimed && (
                        <button onClick={() => claimWinnings(p.marketId)} disabled={txPending}
                          className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-40">
                          🏆 Claim
                        </button>
                      )}
                      {p.won === true && p.claimed && <span className="text-xs font-bold text-green-400">✅ Claimed</span>}
                      {p.won === false && <span className="text-xs font-bold text-red-400">❌ Lost</span>}
                      {p.won === null && <span className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs text-yellow-400">⏳ Pending</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-5">
              <label className="mb-2 block text-xs text-gray-400">Market Type</label>
              <div className="flex gap-3">
                {["binary", "price"].map((t) => (
                  <button key={t} onClick={() => setMktType(t)}
                    className={`flex-1 rounded-xl border py-3 text-xs font-semibold transition-all ${mktType === t ? "border-[#7B61FF] bg-[#7B61FF]/15 text-[#7B61FF]" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                    {t === "binary" ? "⚖️ Yes / No" : "📈 Price Prediction"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-xs text-gray-400">Market Question</label>
              <input value={mktQuestion} onChange={(e) => setMktQuestion(e.target.value)}
                placeholder="e.g. Will LCAI be above $0.10 on May 31st 2026?"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#7B61FF]/50" />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-xs text-gray-400">Resolution Criteria</label>
              <textarea value={mktCriteria} onChange={(e) => setMktCriteria(e.target.value)} rows={3}
                placeholder="e.g. AI will check the LCAI price on CoinGecko at midnight UTC on May 31st 2026. If the price is above $0.10 the outcome is YES."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#7B61FF]/50 resize-none" />
              <p className="mt-1 text-[10px] text-gray-600">Be specific — the AI uses this to determine the outcome.</p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-xs text-gray-400">Market End Date & Time</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] text-gray-600">Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#7B61FF]/50" />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] text-gray-600">Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#7B61FF]/50" />
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-[#7B61FF]/20 bg-[#7B61FF]/8 p-4 text-xs text-gray-400">
              <span className="font-semibold text-[#7B61FF]">AI Resolution</span> — When this market closes, LCAI AI runs inference to determine the outcome. The result is anchored on-chain with a PoI attestation proving the AI ran.
            </div>

            {!wallet && (
              <button onClick={connectWallet} className="w-full rounded-xl border border-[#7B61FF]/50 bg-[#7B61FF]/10 py-3 text-sm font-bold text-[#7B61FF] mb-4">
                Connect Wallet First
              </button>
            )}

            <button onClick={createMarket} disabled={txPending || !wallet}
              className="w-full rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#A855F7] py-3 text-sm font-bold text-white shadow-[0_0_18px_rgba(123,97,255,0.45)] disabled:opacity-40 transition-all">
              {txPending ? "Deploying..." : "Deploy Market on LCAI Mainnet"}
            </button>
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <p className="text-[10px] text-gray-600 font-mono">
            <span className="block">LightMarket: {CONTRACTS.LightMarket}</span>
            <span className="block">AIResolver: {CONTRACTS.AIResolver}</span>
            <span className="block">MarketFactory: {CONTRACTS.MarketFactory}</span>
          </p>
        </div>
      </footer>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg z-50 ${toastType === "error" ? "bg-red-500/90" : "bg-green-500/90"}`}>
          {toastType === "error" ? "✗" : "✓"} {toast}
        </div>
      )}
    </div>
  );
}
