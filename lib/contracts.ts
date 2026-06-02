import { ethers } from "ethers";

export const CONTRACTS = {
  LightMarket: "0xa20f046945a362b713695BEC3896cedC954CF55A",
  AIResolver: "0x035a5e662eF1B9379A96eD3D19fCb8Bc74680597",
  MarketFactory: "0x5e7AA81dC33CA3C2C001F5DbD58b4cD18073e621",
  FeePool: "0x9Aa3ac8fa9ACBE9E709204270450E0E966eA9D5F",
};

export const CHAIN = {
  id: 9200,
  name: "LightchainAI",
  rpc: "https://rpc.mainnet.lightchain.ai",
  explorer: "https://mainnet.lightscan.app",
  symbol: "LCAI",
};

export const LIGHTMARKET_ABI = [
  "function marketCount() view returns (uint256)",
  "function markets(uint256) view returns (uint256 id, address creator, uint8 marketType, uint8 status, string question, string resolutionCriteria, uint256 createdAt, uint256 closesAt, uint256 resolvesAt, uint256 totalPool, uint256 creatorFee, bytes32 poiAttestationHash, uint8 binaryOutcome, uint256 yesPool, uint256 noPool, uint256 resolvedPrice, uint256 targetPrice)",
  "function getMarket(uint256) view returns (tuple(uint256 id, address creator, uint8 marketType, uint8 status, string question, string resolutionCriteria, uint256 createdAt, uint256 closesAt, uint256 resolvesAt, uint256 totalPool, uint256 creatorFee, bytes32 poiAttestationHash, uint8 binaryOutcome, uint256 yesPool, uint256 noPool, uint256 resolvedPrice, uint256 targetPrice))",
  "function getActiveMarkets() view returns (uint256[])",
  "function getResolution(uint256) view returns (tuple(uint256 marketId, bytes32 attestationHash, uint256 resolvedPrice, uint8 outcome, uint256 resolvedAt, address resolvedBy, string aiResponse))",
  "function placeBinaryBet(uint256 marketId, bool isYes) payable",
  "function placePriceBet(uint256 marketId, uint256 predictedPrice) payable",
  "function claimBinaryWinnings(uint256 marketId)",
  "function claimPriceWinnings(uint256 marketId)",
  "function withdraw()",
  "function pendingWithdrawals(address) view returns (uint256)",
  "function createBinaryMarket(string question, string resolutionCriteria, uint256 targetPrice, uint256 closesAt, uint256 resolvesAt, uint256 creatorFeeBps) returns (uint256)",
  "function createPricePredictionMarket(string question, string resolutionCriteria, uint256 closesAt, uint256 resolvesAt, uint256 creatorFeeBps) returns (uint256)",
  "event MarketCreated(uint256 indexed marketId, address indexed creator, uint8 marketType, string question, uint256 closesAt, uint256 resolvesAt)",
  "event BetPlaced(uint256 indexed marketId, address indexed bettor, uint256 amount, bool isYes, uint256 predictedPrice)",
  "event MarketResolved(uint256 indexed marketId, uint8 outcome, uint256 resolvedPrice, bytes32 attestationHash)",
  "event WinningsClaimed(uint256 indexed marketId, address indexed bettor, uint256 amount)",
];

export const AIRESOLVER_ABI = [
  "function requestResolution(uint256 marketId) payable",
  "function isMarketResolved(uint256 marketId) view returns (bool)",
  "function getResolutionRequest(uint256 marketId) view returns (tuple(uint256 marketId, uint256 requestedAt, uint256 fulfilledAt, bool fulfilled, address requestedBy, bytes32 jobId))",
  "event ResolutionRequested(uint256 indexed marketId, address indexed requestedBy, uint256 requestedAt)",
  "event MarketResolved(uint256 indexed marketId, bytes32 indexed attestationHash, uint256 resolvedPrice, address resolver)",
];

export const MARKETFACTORY_ABI = [
  "function createBinaryMarket(string question, string resolutionCriteria, uint256 targetPrice, uint256 duration, uint256 resolutionDelay, uint256 creatorFeeBps) returns (uint256)",
  "function createPricePredictionMarket(string question, string resolutionCriteria, uint256 duration, uint256 resolutionDelay, uint256 creatorFeeBps) returns (uint256)",
  "function pauseCreation(bool paused) external",
  "function marketCreationPaused() view returns (bool)",
];

export const FEEPOOL_ABI = [
  "function getBalance() view returns (uint256)",
  "function treasury() view returns (address)",
  "function distributeFees() external",
  "function emergencyWithdraw() external",
];

export async function getProvider() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== CHAIN.id) {
      await switchToLCAI();
    }
    return provider;
  }
  return new ethers.JsonRpcProvider(CHAIN.rpc);
}

export async function getSigner() {
  const provider = await getProvider();
  if (provider instanceof ethers.BrowserProvider) {
    return provider.getSigner();
  }
  throw new Error("No wallet connected");
}

export async function switchToLCAI() {
  if (typeof window === "undefined" || !(window as any).ethereum) return;
  try {
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${CHAIN.id.toString(16)}` }],
    });
  } catch (err: any) {
    if (err.code === 4902) {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: `0x${CHAIN.id.toString(16)}`,
          chainName: CHAIN.name,
          nativeCurrency: { name: "LCAI", symbol: "LCAI", decimals: 18 },
          rpcUrls: [CHAIN.rpc],
          blockExplorerUrls: [CHAIN.explorer],
        }],
      });
    }
  }
}

export function getLightMarket(signerOrProvider: any) {
  return new ethers.Contract(CONTRACTS.LightMarket, LIGHTMARKET_ABI, signerOrProvider);
}

export function getAIResolver(signerOrProvider: any) {
  return new ethers.Contract(CONTRACTS.AIResolver, AIRESOLVER_ABI, signerOrProvider);
}

export function getMarketFactory(signerOrProvider: any) {
  return new ethers.Contract(CONTRACTS.MarketFactory, MARKETFACTORY_ABI, signerOrProvider);
}

export function getFeePool(signerOrProvider: any) {
  return new ethers.Contract(CONTRACTS.FeePool, FEEPOOL_ABI, signerOrProvider);
}

export function formatLCAI(wei: bigint): string {
  return parseFloat(ethers.formatEther(wei)).toFixed(2);
}

export function parseLCAI(amount: string): bigint {
  return ethers.parseEther(amount);
}
