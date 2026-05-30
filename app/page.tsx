"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  getProvider,
  getSigner,
  getLightMarket,
  switchToLCAI,
  formatLCAI,
  parseLCAI,
  CHAIN,
  CONTRACTS,
} from "../lib/contracts";

const OWNER_ADDRESS = "0x8EC6fAd1CE9Bf18bfc98Ed5b9dCf14dfCFe155FB";

export default function Home() {
  const [activeTab, setActiveTab] = useState("browse");
  const [browseFilter, setBrowseFilter] = useState("open");
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [markets, setMarkets] = useState<any[]>([]);
  const [resolutions, setResolutions] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);
  const [activeMarket, setActiveMarket] = useState<number | null>(null);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [claimedMarkets, setClaimedMarkets] = useState<Set<number>>(new Set());
  const [pendingWinnings, setPendingWinnings] = useState<any>(0);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");
  const [mktType, setMktType] = useState("binary");
  const [mktCategory, setMktCategory] = useState("general");
  const [mktQuestion, setMktQuestion] = useState("");
  const [mktCriteria, setMktCriteria] = useState("");
  const [txPending, setTxPending] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loadOffset, setLoadOffset] = useState(30);
  const [totalMarketCount, setTotalMarketCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
loadMarkets();
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const close = () => setWalletMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const showToast = (msg: string, type = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 4000);
  };

  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        if (isMobile) {
          showToast("Please open in MetaMask app browser or use WalletConnect", "error");
        } else {
          showToast("MetaMask not found. Please install it.", "error");
        }
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
      loadMyBets(address);
      loadPendingWinnings(address);
    } catch (err: any) {
      showToast(err.message || "Failed to connect wallet", "error");
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setBalance("0");
    showToast("Disconnected");
    setWalletMenuOpen(false);
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
      const resMap: Record<number, any> = {};
      const total = Number(count);
      setTotalMarketCount(total);
      // Fetch total volume from ALL markets
      let allVolume = 0;
      for (let i = 0; i < total; i++) {
        try {
          const m = await contract.getMarket(i);
          allVolume += parseFloat(ethers.formatEther(m.totalPool));
        } catch {}
      }
      setTotalVolume(allVolume);
      const start = Math.max(0, total - loadOffset);
      for (let i = start; i < total; i++) {
        try {
          const m = await contract.getMarket(i);
          const closesAtTs = Number(m.closesAt);
          const status = Number(m.status);
          loaded.push({
            id: Number(m.id),
            question: m.question,
            criteria: m.resolutionCriteria,
            type: Number(m.marketType) === 0 ? "binary" : "price",
            category: "general",
            status,
            yesPool: parseFloat(ethers.formatEther(m.yesPool)),
            noPool: parseFloat(ethers.formatEther(m.noPool)),
            totalPool: parseFloat(ethers.formatEther(m.totalPool)),
            closesAtTs,
            closesAtUTC: new Date(closesAtTs * 1000).toUTCString().replace(" GMT", " UTC"),
            resolvesAt: Number(m.resolvesAt),
            creator: m.creator,
            outcome: Number(m.binaryOutcome),
            resolvedPrice: parseFloat(ethers.formatEther(m.resolvedPrice)),
            poiHash: m.poiAttestationHash,
          });
          if (status === 3) {
            try {
              const res = await contract.getResolution(i);
              resMap[i] = {
                aiResponse: res.aiResponse,
                resolvedAt: Number(res.resolvedAt),
                resolvedBy: res.resolvedBy,
                attestationHash: res.attestationHash,
              };
            } catch {}
          }
        } catch {}
      }
      setMarkets(loaded);
      
      setResolutions(resMap);
    } catch (err: any) {
      console.error("loadMarkets failed:", err);
      showToast("Failed to load markets: " + err.message, "error");
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
        side: e.args.isYes ? "YES" : "NO",
        isYes: e.args.isYes,
        amount: parseFloat(ethers.formatEther(e.args.amount)),
        txHash: e.transactionHash,
      }));
      setPortfolio(bets);
    } catch {}
  };

  const getYesPct = (m: any) =>
    m.totalPool === 0 ? 50 : Math.round((m.yesPool / m.totalPool) * 100);

  const getUserBetOnMarket = (marketId: number) =>
    portfolio.find((p) => p.marketId === marketId);

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

  const getUserPendingForMarket = (market: any) => {
    const bet = getUserBetOnMarket(market.id);
    if (!bet) return 0;

    if (market.status === 4) return bet.amount;

    if (market.status === 3) {
      const won = didUserWin(market);
      if (!won) return 0;
      if (market.yesPool + market.noPool === 0) return 0;
      const share =
        bet.amount / (bet.isYes ? market.yesPool : market.noPool);
      return share * market.totalPool;
    }

    return 0;
  };

  const getFilteredMarkets = () => {
let filtered = [...markets].sort((a, b) => b.id - a.id);
    if (browseFilter === "open") filtered = filtered.filter((m) => m.status === 0);
    else if (browseFilter === "closed") filtered = filtered.filter((m) => m.status === 3);
    else if (browseFilter === "biggest")
      filtered = filtered.sort((a, b) => b.totalPool - a.totalPool);
    else if (browseFilter === "ending")
      filtered = filtered
        .filter((m) => m.status === 0)
        .sort((a, b) => a.closesAtTs - b.closesAtTs);
    return filtered;
  };

  const placeBet = async (marketId: number) => {
    if (!termsAccepted) { setShowTerms(true); return; }
    if (!wallet) {
      showToast("Connect wallet first", "error");
      return;
    }
    if (!selectedSide) {
      showToast("Select YES or NO", "error");
      return;
    }
    const amt = parseFloat(betAmount);
    if (!betAmount || isNaN(amt) || amt < 1) {
      showToast("Minimum bet is 1 LCAI", "error");
      return;
    }
    if (amt > 10) {
      showToast("Maximum bet is 10 LCAI during initial alpha testing", "error");
      return;
    }
    const market = markets.find((m) => m.id === marketId);
    if (!market || market.status !== 0) {
      showToast("Market is not open for betting", "error");
      return;
    }
    if (Date.now() / 1000 >= market.closesAtTs) {
      showToast("Market has closed", "error");
      return;
    }
    try {
      setTxPending(true);
      const signer = await getSigner();
      const contract = getLightMarket(signer);
      const tx = await contract.placeBinaryBet(marketId, selectedSide === "yes", {
        value: parseLCAI(betAmount),
      });
      showToast("Transaction submitted...");
      await tx.wait();
      showToast(`Bet placed: ${amt} LCAI on ${selectedSide.toUpperCase()}`);
      setPortfolio([
        ...portfolio,
        {
          marketId,
          question: market.question,
          side: selectedSide.toUpperCase(),
          isYes: selectedSide === "yes",
          amount: amt,
          txHash: tx.hash,
        },
      ]);
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

  const claimWinnings = async (marketId: number) => {
    if (!wallet) {
      showToast("Connect wallet first", "error");
      return;
    }
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
      setClaimedMarkets((prev) => new Set([...prev, marketId]));
      loadPendingWinnings(wallet);
      loadMarkets();
    } catch (err: any) {
      showToast(err.reason || err.message || "Claim failed", "error");
    } finally {
      setTxPending(false);
    }
  };

  const withdrawRefund = async () => {
    if (!wallet) {
      showToast("Connect wallet first", "error");
      return;
    }
    try {
      setTxPending(true);
      const signer = await getSigner();
      const contract = getLightMarket(signer);
      const tx = await contract.withdraw();
      showToast("Refund transaction sent...");
      await tx.wait();
      showToast("Refund successful!");
      if (wallet) loadPendingWinnings(wallet);
      loadMarkets();
    } catch (err: any) {
      showToast(err.reason || err.message || "Refund failed", "error");
    } finally {
      setTxPending(false);
    }
  };

  const manualResolve = async (marketId: number, outcome: number) => {
    try {
      setTxPending(true);
      const signer = await getSigner();
      const contract = new ethers.Contract(
        CONTRACTS.AIResolver,
        ["function submitBinaryResolution(uint256 marketId, uint8 outcome, uint256 resolvedPrice, bytes32 attestationHash, string aiResponse)"],
        signer
      );
      const attestationHash = ethers.keccak256(ethers.toUtf8Bytes(`manual-${marketId}-${Date.now()}`));
      const tx = await contract.submitBinaryResolution(
        marketId, outcome, 0, attestationHash, `Manual resolution by owner: ${outcome === 1 ? "YES" : "NO"}`
      );
      await tx.wait();
      showToast(`Market #${marketId} manually resolved: ${outcome === 1 ? "YES" : "NO"}`, "success");
      loadMarkets();
    } catch (err: any) {
      showToast(err.reason || err.message || "Failed", "error");
    } finally {
      setTxPending(false);
    }
  };

  const cancelMarket = async (marketId: number) => {
    if (!wallet) return;
    try {
      setTxPending(true);
      const signer = await getSigner();
      const contract = getLightMarket(signer);
      const tx = await contract.cancelMarket(marketId, "Cancelled by owner");
      showToast("Cancelling market...");
      await tx.wait();
      showToast("Market cancelled — bets refunded!");
      loadMarkets();
    } catch (err: any) {
      showToast(err.reason || err.message || "Cancel failed", "error");
    } finally {
      setTxPending(false);
    }
  };

  const createMarket = async () => {
    if (!wallet) {
      showToast("Connect wallet first", "error");
      return;
    }
    if (!mktQuestion.trim()) {
      showToast("Enter a market question", "error");
      return;
    }
    if (!mktCriteria.trim()) {
      showToast("Enter resolution criteria", "error");
      return;
    }
    if (!endDate || !endTime) {
      showToast("Select end date and time", "error");
      return;
    }
    const [year, month, day] = endDate.split("-").map(Number);
const [hour, minute] = endTime.split(":").map(Number);
const closesAtDate = new Date(year, month - 1, day, hour, minute, 0);
const closesAt = Math.floor(closesAtDate.getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    if (closesAt <= now) {
      showToast("End time must be in the future", "error");
      return;
    }
    if (closesAt - now < 3600) {
      showToast("Market must run for at least 1 hour", "error");
      return;
    }
    try {
      setTxPending(true);
      const signer = await getSigner();
      const contract = getLightMarket(signer);
      const resolvesAt = closesAt + 3600;
      // Send 1 LCAI creation fee to treasury
      const treasuryTx = await signer.sendTransaction({
        to: "0x8EC6fAd1CE9Bf18bfc98Ed5b9dCf14dfCFe155FB",
        value: ethers.parseEther("1.0"),
      });
      await treasuryTx.wait();
      const tx = await contract.createBinaryMarket(
        mktQuestion,
        mktCriteria,
        0,
        closesAt,
        resolvesAt,
        50
      );
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

  const getCategory = (question: string) => {
    const q = question.toLowerCase();
    if (q.includes("btc") || q.includes("bitcoin") || q.includes("eth") || q.includes("sol") || q.includes("crypto") || q.includes("lcai") || q.includes("price") || q.includes("token")) return { emoji: "💰", label: "Crypto", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" };
    if (q.includes("nfl") || q.includes("nba") || q.includes("mlb") || q.includes("nhl") || q.includes("soccer") || q.includes("tennis") || q.includes("football") || q.includes("basketball") || q.includes("baseball") || q.includes("sport") || q.includes("game") || q.includes("match") || q.includes("championship") || q.includes("super bowl") || q.includes("world cup") || q.includes("playoff")) return { emoji: "🏆", label: "Sports", color: "text-green-400 border-green-400/30 bg-green-400/10" };
    if (q.includes("weather") || q.includes("temperature") || q.includes("rain") || q.includes("snow") || q.includes("°f") || q.includes("°c") || q.includes("humid") || q.includes("wind")) return { emoji: "🌤", label: "Weather", color: "text-blue-400 border-blue-400/30 bg-blue-400/10" };
    if (q.includes("president") || q.includes("election") || q.includes("congress") || q.includes("senate") || q.includes("trump") || q.includes("biden") || q.includes("political") || q.includes("vote") || q.includes("war") || q.includes("government")) return { emoji: "🗳", label: "Politics", color: "text-red-400 border-red-400/30 bg-red-400/10" };
    if (q.includes("ai") || q.includes("gpt") || q.includes("claude") || q.includes("llm") || q.includes("model") || q.includes("openai") || q.includes("tech") || q.includes("software") || q.includes("apple") || q.includes("google") || q.includes("microsoft")) return { emoji: "🤖", label: "AI & Tech", color: "text-purple-400 border-purple-400/30 bg-purple-400/10" };
    return { emoji: "🧠", label: "General", color: "text-[#8B80A8] border-white/10 bg-white/5" };
  };

  const getCountdown = (closesAtTs: number, status: number) => {
    if (status !== 0) return null;
    const diff = closesAtTs - now;
    if (diff <= 0) return "Closing...";
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    if (h > 24) return `${Math.floor(h/24)}d ${h%24}h left`;
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
  };

  const statusLabel = (s: number) =>
    ["Open", "Closed", "Resolving", "Resolved", "Cancelled"][s] || "Unknown";

  const statusColor = (s: number) =>
    s === 0
      ? "text-green-400"
      : s === 3
      ? "text-[#A78BFA]"
      : s === 4
      ? "text-red-400"
      : "text-yellow-400";

  const isOwner =
    wallet?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  const portfolioWithStatus = portfolio.map((p) => {
    const market = markets.find((m) => m.id === p.marketId);
    const won = market ? didUserWin(market) : null;
    const claimed = claimedMarkets.has(p.marketId);
    return {
      ...p,
      market,
      won,
      claimed,
      resolved: market?.status === 3,
    };
  });

  const FILTERS = [
    { key: "open", label: `Open (${markets.filter((m) => m.status === 0).length})` },
    { key: "closed", label: `Resolved (${markets.filter((m) => m.status === 3).length})` },
    { key: "biggest", label: "Biggest Pool" },
    { key: "ending", label: "Ending Soon" },
    { key: "all", label: `All (${markets.length})` },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
<div className="pointer-events-none absolute inset-0 overflow-hidden">
  {/* Base gradient */}
  <div className="absolute inset-0" style={{background: "radial-gradient(ellipse at 50% -20%, rgba(123,97,255,0.3) 0%, rgba(10,2,31,0.8) 50%, transparent 70%)"}} />
  {/* Left aurora streak */}
  <div className="absolute -top-20 -left-20 h-[40rem] w-[60rem] opacity-30" style={{background: "linear-gradient(135deg, transparent 30%, rgba(123,97,255,0.6) 50%, rgba(168,85,247,0.3) 60%, transparent 70%)", transform: "rotate(-15deg)", filter: "blur(40px)"}} />
  {/* Right aurora streak */}
  <div className="absolute -top-10 right-0 h-[30rem] w-[50rem] opacity-20" style={{background: "linear-gradient(225deg, transparent 30%, rgba(221,0,172,0.4) 50%, rgba(123,97,255,0.4) 65%, transparent 75%)", transform: "rotate(10deg)", filter: "blur(50px)"}} />
  {/* Bottom glow */}
  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[15rem] w-[50rem] rounded-full bg-[#7B61FF] opacity-[0.06] blur-[100px]" />
</div>
<header className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <style>{`
          @keyframes neon-flicker {
            0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
              opacity: 1;
              filter: brightness(1) drop-shadow(0 0 8px rgba(123,97,255,0.9)) drop-shadow(0 0 20px rgba(168,85,247,0.7));
            }
            20%, 24%, 55% { opacity: 0.4; filter: brightness(0.6); }
            22% { opacity: 0.8; filter: brightness(0.9); }
          }
          .neon-logo { animation: neon-flicker 6s infinite; }
        `}</style>
        {/* ROW 1 — LM icon left, wallet right */}
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <Image src="/icon.png" alt="LM" width={36} height={36} className="mix-blend-lighten" priority />
          <div className="flex items-center gap-3 relative">
            {pendingWinnings > 0 && (
              <span className="text-xs text-green-400 font-semibold animate-pulse hidden sm:block">
                {formatLCAI(pendingWinnings)} LCAI unclaimed
              </span>
            )}
            {wallet ? (
              <div onClick={(e) => { e.stopPropagation(); setWalletMenuOpen(!walletMenuOpen); }}
                className="relative flex items-center gap-2 rounded-full border border-[#7B61FF]/50 bg-black/50 px-3 py-1.5 text-xs text-[#7B61FF] cursor-pointer">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="hidden sm:block">{balance} LCAI</span>
                <span className="h-3 w-px bg-[#7B61FF]/40 hidden sm:block" />
                <span className="font-mono">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
                {isOwner && <span className="text-[9px] bg-[#7B61FF]/20 rounded px-1">OWNER</span>}
{walletMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[#7B61FF]/30 bg-black/90 backdrop-blur-xl shadow-xl p-3 z-50">
                    <div className="border-b border-white/10 pb-3 mb-3">
                      <p className="text-[10px] text-[#8B80A8] mb-1">Connected Wallet</p>
                      <p className="text-xs font-mono text-white">{wallet.slice(0, 10)}...{wallet.slice(-6)}</p>
                      <p className="text-sm font-bold text-[#A78BFA] mt-1">{balance} LCAI</p>
                    </div>
                    <div className="border-b border-white/10 pb-3 mb-3 grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{portfolio.length}</p>
                        <p className="text-[10px] text-[#8B80A8]">Total Bets</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-400">{portfolio.filter(p => { const m = markets.find(x => x.id === p.marketId); return m && didUserWin(m); }).length}</p>
                        <p className="text-[10px] text-[#8B80A8]">Won</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-400">{portfolio.filter(p => { const m = markets.find(x => x.id === p.marketId); return m && m.status === 3 && !didUserWin(m); }).length}</p>
                        <p className="text-[10px] text-[#8B80A8]">Lost</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-yellow-400">{portfolio.filter(p => { const m = markets.find(x => x.id === p.marketId); return m && m.status === 0; }).length}</p>
                        <p className="text-[10px] text-[#8B80A8]">Pending</p>
                      </div>
                    </div>
                    {pendingWinnings > 0 && (
                      <div className="border-b border-white/10 pb-3 mb-3">
                        <p className="text-xs text-green-400 font-semibold animate-pulse">🏆 {formatLCAI(pendingWinnings)} LCAI to claim!</p>
                      </div>
                    )}
                    <button onClick={() => { setActiveTab("portfolio"); setWalletMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-[#A78BFA] rounded-lg hover:bg-[#7B61FF]/10 transition-all mb-1">
                      📊 View My Bets
                    </button>
                    <button onClick={disconnectWallet} className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
                      🔌 Disconnect Wallet
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={connectWallet} className="rounded-full bg-gradient-to-r from-[#7B61FF] to-[#A855F7] px-4 py-2 text-xs font-bold text-white shadow-[0_0_14px_rgba(123,97,255,0.5)] transition-all">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
        {/* ROW 2 — Nav tabs */}
        <div className="flex justify-center gap-1 px-4 py-1 border-t border-white/5">
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            <button onClick={() => setActiveTab("browse")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeTab === "browse" ? "bg-gradient-to-r from-[#7B61FF] to-[#A855F7] text-white" : "text-[#8B80A8] hover:text-white"}`}>Browse</button>
            <button onClick={() => setActiveTab("portfolio")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeTab === "portfolio" ? "bg-gradient-to-r from-[#7B61FF] to-[#A855F7] text-white" : "text-[#8B80A8] hover:text-white"}`}>My Bets</button>
            <button onClick={() => setActiveTab("create")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeTab === "create" ? "bg-gradient-to-r from-[#7B61FF] to-[#A855F7] text-white" : "text-[#8B80A8] hover:text-white"}`}>+ Create</button>
          </div>
        </div>
        {/* ROW 3 — Alpha warning */}
        <div className="w-full bg-yellow-500/10 border-t border-yellow-500/20 text-center py-1 px-4 text-xs text-yellow-400 font-semibold">
          ⚠️ Alpha Version — Not available to US residents. Max bet 10 LCAI. Use at your own risk.
        </div>
        {/* ROW 4 — Neon sign */}
        <div className="flex justify-center items-center py-0 border-t border-white/5">
          <Image src="/neon-logo.png" alt="LightMarket" width={420} height={30} className="object-contain neon-logo mix-blend-screen" priority />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-12">
        <section className="mb-14 text-center">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[26rem] w-[26rem] rounded-full bg-gradient-to-b from-white via-[#7B61FF] to-[#A855F7] opacity-[0.18] blur-[200px] pointer-events-none" />
          <h1 className="relative text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#E0D7FF] to-[#A78BFA] bg-clip-text text-transparent">
            Predict the Future
          </h1>
          <p className="relative mt-3 bg-gradient-to-r from-[#7B61FF] to-[#A855F7] bg-clip-text text-2xl sm:text-3xl font-bold text-transparent">
            Verified by AI
          </p>
          <p className="relative mt-5 mx-auto max-w-xl text-sm text-[#B8B0D0] leading-relaxed">
            The first AI-native prediction market on LightchainAI. Every outcome resolved by verifiable on-chain inference — no human oracles.
          </p>
          <div className="relative mt-8 flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => setActiveTab("create")}
              className="rounded-full bg-gradient-to-r from-[#7B61FF] to-[#A855F7] px-8 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(123,97,255,0.55)] hover:shadow-[0_0_32px_rgba(168,85,247,0.65)] transition-all"
            >
              ✦ Create Market
            </button>
            <button
              onClick={() => {
                setActiveTab("browse");
                setBrowseFilter("open");
              }}
              className="rounded-full border border-[#7B61FF]/50 bg-[#7B61FF]/10 px-8 py-3 text-sm font-semibold text-[#A78BFA] hover:bg-[#7B61FF]/20 transition-all"
            >
              Browse Markets
            </button>
          </div>
        </section>

        <div className="mb-10 grid grid-cols-3 gap-3">
          {[
            { label: "Open Markets", value: markets.filter((m) => m.status === 0).length.toString() },
            { label: "Total Volume", value: totalVolume.toFixed(1) + " LCAI" },
            { label: "AI Resolved", value: (totalMarketCount > 0 ? totalMarketCount - markets.filter((m) => m.status === 0).length : markets.filter((m) => m.status === 3).length).toString() },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[#7B61FF]/20 bg-[#7B61FF]/5 p-4 text-center"
            >
              <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#7B61FF] to-[#A855F7] bg-clip-text text-transparent">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] text-[#8B80A8]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#E0D7FF]">Markets</h2>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {["browse", "portfolio", "create"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === t
                    ? "bg-gradient-to-r from-[#7B61FF] to-[#A855F7] text-white"
                    : "text-[#8B80A8] hover:text-white"
                }`}
              >
                {t === "create" ? "+ Create" : t === "portfolio" ? "My Bets" : "Browse"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "browse" && (
          <div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setBrowseFilter(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
                    browseFilter === f.key
                      ? "border-[#7B61FF] bg-[#7B61FF]/20 text-[#A78BFA]"
                      : "border-white/10 text-[#8B80A8] hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={loadMarkets}
                className="ml-auto rounded-lg px-3 py-1.5 text-xs text-[#8B80A8] border border-white/10 hover:text-white transition-all"
              >
                ↻ Refresh
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {loading && (
                <div className="text-center py-10">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#7B61FF] border-t-transparent mb-2" />
                  <p className="text-sm text-[#8B80A8]">Loading markets from chain...</p>
                </div>
              )}

              {!loading && getFilteredMarkets().length === 0 && (
                <div className="text-center py-16 text-[#8B80A8]">
                  <p className="text-3xl mb-3">🎯</p>
                  <p>No markets found — create the first one!</p>
                </div>
              )}

              {getFilteredMarkets().map((m) => {
                const yesPct = getYesPct(m);
                const isActive = activeMarket === m.id;
                const isResolved = m.status === 3;
                const userBet = getUserBetOnMarket(m.id);
                const won = didUserWin(m);
                const claimed = claimedMarkets.has(m.id);
                const resolution = resolutions[m.id];
                const userPending = getUserPendingForMarket(m);

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setActiveMarket(isActive ? null : m.id);
                      setSelectedSide(null);
                      setBetAmount("");
                    }}
className={`rounded-2xl border p-5 backdrop-blur-xl cursor-pointer transition-all relative overflow-hidden ${
  isActive
    ? "border-[#7B61FF]/60 bg-[#7B61FF]/5 shadow-[0_0_20px_rgba(123,97,255,0.2)]"
    : `border-white/10 hover:border-[#7B61FF]/40 hover:shadow-[0_0_20px_rgba(123,97,255,0.15)] ${
        getCategory(m.question).label === "Crypto" ? "bg-yellow-500/3" :
        getCategory(m.question).label === "Sports" ? "bg-green-500/3" :
        getCategory(m.question).label === "Weather" ? "bg-blue-500/3" :
        getCategory(m.question).label === "Politics" ? "bg-red-500/3" :
        getCategory(m.question).label === "AI & Tech" ? "bg-purple-500/3" :
        "bg-white/3"
      }`
}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-sm font-semibold leading-snug text-white">{m.question}</p>
                      <div className="flex gap-1 shrink-0">
                        {(() => { const cat = getCategory(m.question); return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${cat.color}`}>{cat.emoji} {cat.label}</span>; })()}
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#7B61FF]/20 text-[#A78BFA] border border-[#7B61FF]/30">
                          Yes / No
                        </span>
                      </div>
                    </div>

                    {m.criteria && (
                      <details className="mb-3">
                        <summary className="cursor-pointer text-[10px] text-[#7B61FF] hover:underline">📋 View resolution criteria</summary>
                        <p className="mt-1 text-[10px] text-[#8B80A8] leading-relaxed bg-black/20 rounded-lg p-2 border border-white/5">{m.criteria}</p>
                      </details>
                    )}
                    {userBet && (
                      <div
                        className={`mb-3 rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-between ${
                          won === true
                            ? "border-green-500/40 bg-green-500/10 text-green-400"
                            : won === false
                            ? "border-red-500/40 bg-red-500/10 text-red-400"
                            : "border-white/10 bg-white/5 text-[#8B80A8]"
                        }`}
                      >
                        <span>
                          Your bet: {userBet.amount} LCAI on {userBet.side}
                        </span>
                        <span>
                          {won === true ? "🏆 Won!" : won === false ? "❌ Lost" : "⏳ Pending"}
                        </span>
                      </div>
                    )}

                    {!isResolved && (
                      <>
                        <div className="flex gap-3 mb-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMarket(m.id);
                              setSelectedSide("yes");
                            }}
                            className="flex-1 rounded-xl border border-green-500/30 bg-green-500/10 py-2.5 text-center transition-all hover:bg-green-500/20"
                          >
                            <p className="text-lg font-bold text-green-400">{yesPct}%</p>
                            <p className="text-[10px] text-green-400/70">YES</p>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMarket(m.id);
                              setSelectedSide("no");
                            }}
                            className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-center transition-all hover:bg-red-500/20"
                          >
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
  <div className="mb-3 rounded-xl border border-[#7B61FF]/30 bg-[#7B61FF]/10 p-3 text-xs">
    <div className="flex items-center justify-between text-[#A78BFA] mb-1">
      <span>
        ⚡ AI Resolved — Outcome:{" "}
        {m.outcome === 1 ? "YES ✅" : m.outcome === 2 ? "NO ❌" : "N/A"}
      </span>
      <span className="text-[#8B80A8]">
        Pool: {m.totalPool.toFixed(1)} LCAI
      </span>
    </div>
    {resolution && (
      <div className="text-[10px] text-[#8B80A8] mt-1">
        <span>AI said: "{resolution.aiResponse}" · </span>
        
        <a
          target="_blank"
          rel="noreferrer"
          className="text-[#7B61FF] hover:underline"
        >
          View resolver →
        </a>
      </div>
    )}
  </div>
)}
                    {isResolved && userBet && won === true && !claimed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          claimWinnings(m.id);
                        }}
                        disabled={txPending}
                        className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-2.5 text-sm font-bold text-white mb-3 disabled:opacity-40 transition-all"
                      >
                        {txPending ? "Claiming..." : "🏆 Claim Winnings"}
                      </button>
                    )}

                    {isResolved && userBet && won === true && claimed && (
                      <div className="w-full rounded-xl border border-green-500/30 bg-green-500/10 py-2 text-sm font-bold text-green-400 text-center mb-3">
                        ✅ Winnings Claimed
                      </div>
                    )}

{isResolved && userBet && won === false && (
                      <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-sm font-bold text-red-400 text-center mb-3">
                        ❌ Better luck next time
                      </div>
                    )}
                    {isResolved && userBet && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const msg = `🚨 Human Review Requested\nMarket #${m.id}: "${m.question}"\nResolution: ${resolutions[m.id]?.aiResponse || "unknown"}\nRequested by: ${wallet}`;
                          navigator.clipboard.writeText(msg);
                          showToast("Review request copied — paste in Discord!", "success");
                        }}
                        className="w-full rounded-xl border border-orange-500/30 bg-orange-500/10 py-2 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 transition-all mb-3"
                      >
                        🚨 Request Human Review
                      </button>
                    )}

                    {m.status === 4 && userBet && userPending > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          withdrawRefund();
                        }}
                        disabled={txPending}
                        className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 py-2.5 text-sm font-bold text-black mb-3 disabled:opacity-40 transition-all"
                      >
                        {txPending ? "Processing Refund..." : "💸 Withdraw Refund"}
                      </button>
                    )}

                    {m.status === 4 && userBet && userPending === 0 && (
                      <div className="w-full rounded-xl border border-yellow-500/30 bg-yellow-500/10 py-2 text-sm font-bold text-yellow-400 text-center mb-3">
                        ✅ Refund Withdrawn
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-[#8B80A8] flex-wrap">
                      <span className={`flex items-center gap-1 ${statusColor(m.status)}`}>
                        ● {statusLabel(m.status)}
                      </span>
<span title={m.closesAtUTC}>
  {m.status === 0
    ? (() => {
        const diff = m.closesAtTs - now;
        if (diff <= 0) return "⏱ Closing...";
        const d = Math.floor(diff / 86400);
        const h = Math.floor((diff % 86400) / 3600);
        const min = Math.floor((diff % 3600) / 60);
        if (d > 0) return `⏱ ${d}d ${h}h left`;
        if (h > 0) return `⏱ ${h}h ${min}m left`;
        return `⏱ ${min}m left`;
      })()
    : `🕐 ${m.closesAtUTC}`}
</span>
                      <span>Pool: {m.totalPool.toFixed(1)} LCAI</span>
                      <span className="ml-auto flex items-center gap-1 rounded-full bg-[#7B61FF]/10 border border-[#7B61FF]/20 px-2 py-0.5 text-[#A78BFA]">
                        ⚡ AI
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[#4B4560] font-mono">Market #{m.id}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`Market #${m.id}: "${m.question}" — ${window.location.href}`); showToast("Market ID copied — paste in Discord to report!", "success"); }}
                        className="text-[10px] text-[#4B4560] hover:text-red-400 transition-all">
                        🚩 Report
                      </button>
                    </div>

                    {isActive && m.status === 0 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 rounded-xl border border-[#7B61FF]/30 bg-black/40 p-4"
                      >
                        <p className="text-xs font-semibold text-[#8B80A8] mb-3">
                          Place Your Bet
                        </p>

                        <div className="flex gap-2 mb-3">
                          {["yes", "no"].map((side) => (
                            <button
                              key={side}
                              onClick={() => setSelectedSide(side)}
                              className={`flex-1 rounded-xl border py-2 text-xs font-bold uppercase transition-all ${
                                selectedSide === side
                                  ? side === "yes"
                                    ? "border-green-500 bg-green-500/20 text-green-400"
                                    : "border-red-500 bg-red-500/20 text-red-400"
                                  : side === "yes"
                                  ? "border-green-500/30 text-green-400/60"
                                  : "border-red-500/30 text-red-400/60"
                              }`}
                            >
                              {side}
                            </button>
                          ))}
                        </div>

                        <input
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          placeholder="Amount in LCAI (min 1)"
                          className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-[#7B61FF]/50"
                        />

                        <div className="flex gap-2 mb-4">
                          {[10, 50, 100, 500].map((v) => (
                            <button
                              key={v}
                              onClick={() => setBetAmount(v.toString())}
                              className="rounded-lg border border-[#7B61FF]/30 bg-[#7B61FF]/10 px-3 py-1 text-xs text-[#A78BFA] hover:bg-[#7B61FF]/20 transition-all"
                            >
                              {v}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => placeBet(m.id)}
                          disabled={txPending}
                          className="w-full rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#A855F7] py-2.5 text-sm font-bold text-white disabled:opacity-40 transition-all"
                        >
                          {txPending ? "Confirming..." : "Place Bet on LCAI"}
                        </button>

                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelMarket(m.id);
                            }}
                            disabled={txPending}
                            className="mt-2 w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-xs font-semibold text-red-400 disabled:opacity-40 transition-all"
                          >
                            ⚠ Cancel Market & Refund All Bets
                          </button>
                        )}
                      </div>
                    )}

                    {isActive && m.status !== 0 && isOwner && (
                      <div onClick={(e) => e.stopPropagation()} className="mt-3 flex flex-col gap-2">
                        <p className="text-[10px] text-[#8B80A8] font-semibold">👑 Owner Controls</p>
                        <div className="flex gap-2">
                          <button onClick={() => manualResolve(m.id, 1)} disabled={txPending || m.status === 3} className="flex-1 rounded-xl border border-green-500/30 bg-green-500/10 py-2 text-xs font-semibold text-green-400 disabled:opacity-40 hover:bg-green-500/20 transition-all">✅ Resolve YES</button>
                          <button onClick={() => manualResolve(m.id, 2)} disabled={txPending || m.status === 3} className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-xs font-semibold text-red-400 disabled:opacity-40 hover:bg-red-500/20 transition-all">❌ Resolve NO</button>
                        </div>
                        <button onClick={() => cancelMarket(m.id)} disabled={txPending || m.status === 3} className="w-full rounded-xl border border-orange-500/30 bg-orange-500/10 py-2 text-xs font-semibold text-orange-400 disabled:opacity-40 hover:bg-orange-500/20 transition-all">
                          {m.status === 3 ? "Already Resolved" : "⚠ Cancel & Refund"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {loadOffset < 200 && (
              <div className="text-center mt-6">
                <button onClick={() => { setLoadOffset(prev => prev + 30); loadMarkets(); }} className="rounded-full border border-[#7B61FF]/30 bg-[#7B61FF]/10 px-6 py-2 text-xs text-[#A78BFA] hover:bg-[#7B61FF]/20 transition-all">
                  Load More Markets
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "portfolio" && (
          <div>
            {wallet ? (
              portfolioWithStatus.length === 0 ? (
                <div className="text-center py-16 text-[#8B80A8]">
                  <p className="text-3xl mb-3">🎯</p>
                  <p>No bets yet — go make some predictions!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                                    {portfolioWithStatus.map((p, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-2xl border p-4 ${
                        p.won === true
                          ? "border-green-500/30 bg-green-500/5"
                          : p.won === false
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-white/10 bg-white/3"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {p.market?.question || p.question}
                        </p>
                        <p className="text-xs text-[#8B80A8] mt-1">
                          {p.amount} LCAI on{" "}
                          <span
                            className={`font-semibold ${
                              p.side === "YES" ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {p.side}
                          </span>
                          {p.market && (
                            <span className="ml-2 text-[#8B80A8]">
                              · {statusLabel(p.market.status)}
                            </span>
                          )}
                        </p>

                        {p.txHash && (
                          <a
                            href={`${CHAIN.explorer}/tx/${p.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-[#7B61FF] hover:underline mt-1 block"
                          >
                            View on explorer ↗
                          </a>
                        )}
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        {p.won === true && !p.claimed && (
                          <button
                            onClick={() => claimWinnings(p.marketId)}
                            disabled={txPending}
                            className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                          >
                            🏆 Claim
                          </button>
                        )}

                        {p.won === true && p.claimed && (
                          <span className="text-xs font-bold text-green-400">
                            ✅ Claimed
                          </span>
                        )}

                        {p.won === false && (
                          <span className="text-xs font-bold text-red-400">
                            ❌ Lost
                          </span>
                        )}

{p.won === null && p.market?.status === 0 && (
  <span className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs text-yellow-400">
    ⏳ Open
  </span>
)}
{p.won === null && (p.market?.status === 1 || p.market?.status === 2) && (
  <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs text-blue-400">
    🔄 Resolving
  </span>
)}
{p.won === null && p.market?.status === 3 && (
  <span className="text-xs font-bold text-red-400">
    ❌ Lost
  </span>
)}
{p.market?.status === 4 && (
  <button
    onClick={() => withdrawRefund()}
    disabled={txPending}
    className="rounded-full bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 text-xs text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-40"
  >
    💸 Withdraw Refund
  </button>
)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-16 text-[#8B80A8]">
                <p className="text-3xl mb-3">🔗</p>
                <p className="mb-4">Connect your wallet to see your bets</p>
                <button
                  onClick={connectWallet}
                  className="rounded-full bg-gradient-to-r from-[#7B61FF] to-[#A855F7] px-6 py-2.5 text-sm font-bold text-white"
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div className="rounded-2xl border border-[#7B61FF]/20 bg-[#7B61FF]/3 p-6 backdrop-blur-xl">
            <h3 className="text-base font-bold text-[#E0D7FF] mb-5">Create a Prediction Market</h3>
            <div className="mb-5">
              <label className="mb-2 block text-xs text-[#8B80A8]">Market Category</label>
              <div className="grid grid-cols-3 gap-2 mb-1">
                {[{key:"crypto",label:"💰 Crypto",hint:"BTC, ETH, LCAI prices"},{key:"general",label:"🧠 General",hint:"Facts, science, history"},{key:"current",label:"📰 Current Events",hint:"News, politics, sports"},{key:"weather",label:"🌤 Weather",hint:"Temperature, conditions"},{key:"ai",label:"🤖 AI & Tech",hint:"Models, launches, products"},{key:"custom",label:"✦ Custom",hint:"Anything else"}].map((cat)=>(
                  <button key={cat.key} onClick={()=>setMktCategory(cat.key)} className={`rounded-xl border p-2 text-left transition-all ${mktCategory===cat.key?"border-[#7B61FF] bg-[#7B61FF]/20":"border-white/10 bg-white/3 hover:border-white/20"}`}>
                    <p className="text-xs font-semibold text-white">{cat.label}</p>
                    <p className="text-[10px] text-[#8B80A8]">{cat.hint}</p>
                  </button>
                ))}
              </div>
              {mktCategory==="crypto"&&<p className="text-[10px] text-green-400 mt-1">✓ AI will use live price data from Binance/CoinGecko</p>}
              {mktCategory==="weather"&&<p className="text-[10px] text-yellow-400 mt-1">⚠ Be very specific about location and time</p>}
              {mktCategory==="current"&&<p className="text-[10px] text-blue-400 mt-1">✓ AI will search the web for current information</p>}
            </div>
            <div className="mb-5">
              <label className="mb-2 block text-xs text-[#8B80A8]">Market Question</label>
              <input value={mktQuestion} onChange={(e)=>setMktQuestion(e.target.value)}
                placeholder={mktCategory==="crypto"?"e.g. Will BTC be above $80,000 at close time?":mktCategory==="weather"?"e.g. Will it be above 70°F in Chicago at close time?":mktCategory==="current"?"e.g. Is Donald Trump currently the US President?":mktCategory==="ai"?"e.g. Is GPT-5 available to the public?":"e.g. Is the Pacific Ocean the largest ocean on Earth?"}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#7B61FF]/50"/>
            </div>
            <div className="mb-5">
              <label className="mb-2 block text-xs text-[#8B80A8]">Resolution Criteria</label>
              <textarea value={mktCriteria} onChange={(e)=>setMktCriteria(e.target.value)} rows={3}
                placeholder={mktCategory==="crypto"?"e.g. Check the current BTC/USD price on CoinGecko. If above $80,000 answer YES, otherwise NO.":mktCategory==="weather"?"e.g. Search for current Chicago temperature. If above 70°F answer YES, otherwise NO.":mktCategory==="current"?"e.g. Search for the current US President. If Donald Trump answer YES, otherwise NO.":"e.g. Search for the answer. If confirmed answer YES, otherwise NO."}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#7B61FF]/50 resize-none"/>
              <p className="mt-1 text-[10px] text-[#8B80A8]">Be specific — the AI uses this exact criteria to determine the outcome. 💡 Tip: Ask ChatGPT or Copilot to write your resolution criteria!</p>
            </div>
            <div className="mb-6">
              <label className="mb-2 block text-xs text-[#8B80A8]">Market Duration <span className="text-[#7B61FF]">(your local time)</span></label>
              <div className="flex gap-2 mb-3 flex-wrap">
                {[{l:"1hr",h:1},{l:"4hrs",h:4},{l:"24hrs",h:24},{l:"7 days",h:168}].map((o)=>{
                  return <button key={o.l} onClick={()=>{const d=new Date(Date.now()+o.h*3600000);setEndDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);setEndTime(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`);}} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#8B80A8] hover:text-white hover:border-[#7B61FF]/50 transition-all">{o.l}</button>
                })}
              </div>
              <div className="flex gap-3">
                <div className="flex-1"><input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#7B61FF]/50"/></div>
                <div className="flex-1"><input type="time" value={endTime} onChange={(e)=>setEndTime(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#7B61FF]/50"/></div>
              </div>
              {endDate&&endTime&&<p className="mt-1 text-[10px] text-[#7B61FF]">UTC: {new Date(`${endDate}T${endTime}`).toUTCString()}</p>}
            </div>
            <div className="mb-5 rounded-xl border border-[#7B61FF]/20 bg-[#7B61FF]/8 p-4 text-xs text-[#8B80A8]">
              <p className="font-semibold text-[#A78BFA] mb-1">⚡ AI Resolution</p>
              <p>When this market closes, AI searches the web and determines the outcome. The result is anchored on-chain with a PoI attestation.</p>
            </div>
            <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-400">⚠ Only Yes/No markets available. Live in-game sports markets may not resolve accurately — use specific verifiable criteria with clear YES/NO conditions.</div>
            {!wallet?(
              <button onClick={connectWallet} className="w-full rounded-xl border border-[#7B61FF]/50 bg-[#7B61FF]/10 py-3 text-sm font-bold text-[#A78BFA] mb-4">Connect Wallet First — Best on Desktop with MetaMask</button>
            ):(
              <button onClick={createMarket} disabled={txPending} className="w-full rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#A855F7] py-3 text-sm font-bold text-white shadow-[0_0_18px_rgba(123,97,255,0.45)] disabled:opacity-40 transition-all">
                {txPending?"Deploying...":"✦ Deploy Market on LCAI Mainnet (1 LCAI fee)"}
              </button>
            )}
          </div>
        )}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-[#7B61FF]/30 bg-[#0A021F] p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-white mb-4">⚠️ Terms of Use</h2>
            <div className="text-xs text-[#8B80A8] space-y-3 mb-6 max-h-60 overflow-y-auto">
              <p>LightMarket is an experimental alpha prediction market built on LightchainAI. By using this platform you agree to the following:</p>
              <p>1. <strong className="text-white">Not available to US residents.</strong> If you are a US resident you must not use this platform.</p>
              <p>2. <strong className="text-white">Alpha software.</strong> This is experimental software. Markets may resolve incorrectly. Funds may be lost.</p>
              <p>3. <strong className="text-white">No guarantees.</strong> LightMarket makes no guarantees about the accuracy of AI resolutions.</p>
              <p>4. <strong className="text-white">Max bet 10 LCAI</strong> during alpha period.</p>
              <p>5. <strong className="text-white">Use at your own risk.</strong> You are solely responsible for any losses.</p>
              <p>6. AI resolves all markets. In case of dispute, the owner may manually resolve.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTerms(false)} className="flex-1 rounded-xl border border-white/10 py-2 text-xs text-[#8B80A8] hover:text-white transition-all">Decline</button>
              <button onClick={() => { setTermsAccepted(true); setShowTerms(false); }} className="flex-1 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#A855F7] py-2 text-xs font-bold text-white">I Agree</button>
            </div>
          </div>
        </div>
      )}
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <p className="text-[10px] text-[#8B80A8]">
            Powered by LightchainAI · AI-Native Prediction Markets
          </p>
          <p className="text-[10px] text-[#4B4560] font-mono hidden sm:block">
            {CONTRACTS.LightMarket.slice(0, 10)}...
            {CONTRACTS.LightMarket.slice(-6)}
          </p>
        </div>
      </footer>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg z-50 whitespace-nowrap ${
            toastType === "error" ? "bg-red-500/90" : "bg-[#7B61FF]/90"
          }`}
        >
          {toastType === "error" ? "✗" : "✓"} {toast}
        </div>
      )}
    </div>
  );
}

