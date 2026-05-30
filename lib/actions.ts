import { ethers } from "ethers";
import { CONTRACTS } from "./constants";
import * as LightMarketABI from "./abi/LightMarket.json";
import * as AIResolverABI from "./abi/AIResolver.json";
import { getSigner } from "./wallet";

const LIGHT_MARKET_ABI = (LightMarketABI as any).default ?? LightMarketABI;
const AI_RESOLVER_ABI = (AIResolverABI as any).default ?? AIResolverABI;

// -------------------------------
// PLACE YES/NO BET
// -------------------------------
export async function placeBet(
  marketId: number,
  side: string,
  amount: string,
  showToast: (msg: string, type?: "success" | "error") => void,
  setTxPending: (v: boolean) => void
) {
  try {
    setTxPending(true);

const signer = (await getSigner()) as any;
const contract = new ethers.Contract(
  CONTRACTS.LightMarket,
  (LightMarketABI as any).default ?? LightMarketABI,
  signer
);

    const tx = await contract.placeBet(
      marketId,
      side === "yes" ? 1 : 2,
      {
        value: ethers.parseEther(amount.toString()),
      }
    );

    showToast("Transaction sent...");
    await tx.wait();
    showToast("Bet placed successfully!");
  } catch (err) {
    console.error(err);
    showToast("Bet failed", "error");
  } finally {
    setTxPending(false);
  }
}

// -------------------------------
// PLACE PRICE BET
// -------------------------------
export async function placePriceBet(
  marketId: number,
  predictedPrice: number,
  amount: string,
  showToast: (msg: string, type?: "success" | "error") => void,
  setTxPending: (v: boolean) => void
) {
  try {
    setTxPending(true);

const signer = (await getSigner()) as any;
    const contract = new ethers.Contract(
  CONTRACTS.LightMarket,
  (LightMarketABI as any).default ?? LightMarketABI,
  signer
);

    const tx = await contract.placePriceBet(
      marketId,
      ethers.parseUnits(predictedPrice.toString(), 6),
      {
        value: ethers.parseEther(amount.toString()),
      }
    );

    showToast("Transaction sent...");
    await tx.wait();
    showToast("Price bet placed!");
  } catch (err) {
    console.error(err);
    showToast("Bet failed", "error");
  } finally {
    setTxPending(false);
  }
}

// -------------------------------
// REQUEST AI RESOLUTION
// -------------------------------
export async function requestResolution(
  marketId: number,
  showToast: (msg: string, type?: "success" | "error") => void,
  setTxPending: (v: boolean) => void
) {
  try {
    setTxPending(true);

    const signer = (await getSigner()) as any;

    const resolver = new ethers.Contract(
      CONTRACTS.AIResolver,
      AI_RESOLVER_ABI,
      signer
    );

    const tx = await resolver.requestResolution(marketId);

    showToast("Resolution requested...");
    await tx.wait();
    showToast("AI resolution started!");
  } catch (err) {
    console.error(err);
    showToast("Resolution failed", "error");
  } finally {
    setTxPending(false);
  }
}
