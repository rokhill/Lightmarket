# ⚡ LightMarket

**The first AI-native prediction market on LightchainAI.**

Every outcome is resolved by verifiable on-chain LCAI inference and anchored with a Proof of Intelligence attestation. Owner safeguards remain during alpha and will be progressively removed as the resolver proves out — full decentralization is on our roadmap.

🌐 **Live dApp:** https://lightmarket-frontend.vercel.app  
📦 **dApp Hub:** https://hub.lightchain.ai  
🔗 **Explorer:** https://mainnet.lightscan.app  
🐛 **Report Issues:** https://github.com/rokhill/Lightmarket/issues  
💬 **Discord:** https://discord.gg/UnGgSTjH

---

## What is LightMarket?

LightMarket is a decentralized prediction market built natively on the LightchainAI (LCAI) blockchain. Users create YES/NO prediction markets on any topic — crypto prices, sports results, current events, weather, politics, AI developments, and more. When a market closes, the outcome is automatically determined by native LCAI AI inference and anchored on-chain with a Proof of Intelligence (PoI) attestation.

**Built for autonomous, verifiable resolution — every result is settled by LCAI inference and provable on-chain. Owner safeguards remain during alpha and are being phased out as the resolver proves out.**

---

## How It Works

### Creating a Market
1. Connect your MetaMask wallet to LCAI mainnet (Chain ID: 9200)
2. Click **+ Create** and select a category
3. Write your market question (e.g. "Will BTC be above $100,000 at close time?")
4. Write clear resolution criteria (tip: use ChatGPT or Copilot to write good criteria)
5. Set market duration (minimum 55 minutes)
6. Pay 1 LCAI creation fee
7. Deploy to LCAI mainnet

### Placing a Bet
1. Browse open markets
2. Click a market card to expand
3. Select YES or NO
4. Enter your bet amount (max 10 LCAI during alpha)
5. Click **Place Bet on LCAI**
6. Confirm transaction in MetaMask

### Resolution Flow
When a market closes the resolver automatically:
1. Fetches real-time data from multiple APIs
2. Sends an enriched prompt to native LCAI inference (3 retries)
3. Runs a Groq sanity check
4. Submits the result on-chain with a PoI attestation
5. Winners can claim their winnings immediately

### Claiming Winnings
1. Connect your wallet
2. Find your resolved market in **My Bets**
3. Click **🏆 Claim Winnings**
4. Confirm transaction

---

## Features

### For Users
- **Browse Markets** — view all open and resolved markets, filter by category
- **My Bets** — track all your active and resolved bets
- **User Profile** — see total bets, wins, losses, pending bets and unclaimed winnings
- **Market Categories** — 💰 Crypto, 🏆 Sports, 🌤 Weather, 🗳 Politics, 🤖 AI & Tech, 🧠 General
- **Resolution Criteria** — every market shows exactly how it will be resolved
- **View Resolver** — every resolved market links to the on-chain TX proof
- **Human Review** — request manual review if you believe a resolution was incorrect
- **Featured Markets** — top markets by pool size shown at the top of browse
- **Load More** — paginated market loading (30 at a time)
- **Report Market** — flag suspicious or incorrect markets directly from the card
- **Countdown Timer** — see exactly how much time is left on open markets

### For Market Creators
- **AI Suggestions** — use ChatGPT or Copilot to write resolution criteria
- **Category Selection** — choose from 6 market categories
- **Category Badges** — auto-detected from market question keywords
- **Clear Form** — reset the create form with one click
- **UTC Preview** — see the exact UTC time your market will close
- **Rate Limited** — max 10 markets per wallet per 24 hours during alpha

### For the Platform
- **Alpha Disclaimer** — clearly marked as alpha, US residents warned
- **Max Bet** — 10 LCAI maximum during alpha testing
- **Terms of Service** — users must accept terms before betting
- **Owner Controls** — manual resolve YES/NO, cancel & refund, hide markets
- **Skeleton Loading** — smooth loading experience while fetching markets

---

## Reporting Issues

Found a bug or incorrect resolution? Here's how to report:

### Option 1 — Report Market Button
Every market card has a 🚩 **Report** button. Click it to copy market details to clipboard, then paste in Discord.

### Option 2 — Human Review Button
On resolved markets, click **🚨 Request Human Review** to flag the market for owner review.

### Option 3 — GitHub Issues
Open a detailed bug report at: https://github.com/rokhill/Lightmarket/issues

### Option 4 — Discord
Join the LightMarket Discord: https://discord.gg/UnGgSTjH

**When reporting please include:**
- Market ID (shown on every card as "Market #N")
- Expected outcome vs actual outcome
- Your wallet address
- TX hash if available

---

## AI Resolution Engine

### Evidence-Based Resolution
LightMarket resolves markets like a courtroom, not a guess. The resolver:
1. **Gathers verified live evidence** — current prices, official scores, web search results, and more, collected at resolution time from independent sources.
2. **Presents the evidence to native LCAI inference as a case** — the on-chain AI is instructed to rule a verdict based ONLY on the verified live evidence, explicitly disregarding its own (potentially outdated) training. This is the key safeguard: the AI judges the present, not its memory.
3. **Cross-checks with a second model (Groq)** judging the same evidence.
4. **Safety-first verdict:**
   - Clear verdict, sources agree → resolve ✅
   - Evidence insufficient, contradictory, or AI returns UNKNOWN → **auto-cancel + full refund** 🔄
   - Principle: the resolver only settles when the evidence makes the outcome clear. When it can't, it refunds rather than guessing.

Crypto and sports markets gather hard data (close-time prices, official scores) and present it to LCAI as verified evidence to reason over — see below. Nothing bypasses the judge; the deterministic data simply makes the verdict unambiguous.

### Real-Time Data APIs
The resolver enriches every prompt with live data before sending to LCAI:

| API | Data | Key Required |
|-----|------|-------------|
| Kraken | BTC, ETH, SOL close-time prices | No |
| Coinbase | BTC, ETH, SOL price fallback | No |
| CryptoCompare | Minute-accurate price fallback | No |
| CoinGecko | LCAI price + daily fallback | No |
| ESPN | Live sports scores & results | No |
| Open-Meteo | Weather for 10+ cities | No |
| Tavily | Web search, current events | Yes |
| Alpha Vantage | Stock prices | Yes |
| NewsAPI | Current headlines | Yes |
| Wikipedia | Facts verification | No |
| World Bank | Economic data | No |

### Crypto Price Markets
BTC, ETH, SOL, and LCAI markets are resolved by LCAI reasoning over the **verified price at market close** — not the price when the resolver happens to run. Prices come from multiple independent, US-accessible sources (Kraken → Coinbase → CryptoCompare → CoinGecko) with minute-level accuracy, so a market asking "above/below $X at close" is judged on the true close-time price.

### Sports Markets
Team-sport and tennis markets are resolved by LCAI reasoning over **ESPN's official final scores** (only on an explicit league tag). Select the exact league at creation (NBA, NFL, MLB, NHL, WNBA, college, soccer, ATP/WTA). The resolver matches the named competitors to the finished game, reads the real winner, and settles. If it cannot confidently match exactly one finished game, it refunds rather than risk a wrong outcome.

---

## Smart Contracts (LCAI Mainnet — Chain ID 9200)

| Contract | Address |
|----------|---------|
| LightMarket | `0xa20f046945a362b713695BEC3896cedC954CF55A` |
| AIResolver | `0x035a5e662eF1B9379A96eD3D19fCb8Bc74680597` |
| MarketFactory | `0x5e7AA81dC33CA3C2C001F5DbD58b4cD18073e621` |
| FeePool | `0x9Aa3ac8fa9ACBE9E709204270450E0E966eA9D5F` |

**Network Details:**
- Chain ID: 9200
- RPC: https://rpc.mainnet.lightchain.ai
- Explorer: https://mainnet.lightscan.app

---

## Fees

| Fee | Amount | Destination |
|-----|--------|-------------|
| Market Creation | 1 LCAI | Treasury |
| Platform Fee | 1% of pool | Platform |
| Creator Fee | 0.5% of pool | Market creator |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Wallet | ethers.js v6, MetaMask |
| Contracts | Solidity, LCAI mainnet |
| Resolver | Node.js, PM2, ethers.js v5 |
| Deployment | Vercel |
| AI Inference | Native LCAI workers via WebSocket relay |
| Crypto | P-256 ECDH, AES-256-GCM |

---

## Running Locally

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- LCAI mainnet configured in MetaMask

### Frontend
```bash
git clone https://github.com/rokhill/Lightmarket.git
cd Lightmarket
npm install
npm run dev
```

Open http://localhost:3000

### Resolver
The resolution engine is a proprietary off-chain service operated by the team during alpha. It watches markets, gathers verified live evidence, routes each market through LCAI inference for a reasoned verdict, and submits the LCAI-attested outcome on-chain. It is not open for third-party operation at this stage; decentralizing resolution is on the roadmap.

---

## Roadmap

### Phase 1 — Alpha (Current ✅)
- ✅ Core YES/NO prediction market contracts
- ✅ Native LCAI inference resolution
- ✅ Evidence-based resolution (LCAI judges verified live data + Groq cross-check)
- ✅ Multi-API real-time data enrichment
- ✅ Frontend dApp on Vercel
- ✅ Market categories with emoji badges
- ✅ User profile with bet history
- ✅ Owner manual resolve + cancel
- ✅ Human review request system
- ✅ Report market button
- ✅ Market creation fee (1 LCAI)
- 🔄 dApp Hub submission (pending review)
- ✅ GitHub open source

### Phase 2 — Beta (Coming Soon)
- [ ] **Multiple market types** — range markets, multi-outcome markets
- [ ] **Price range markets** — "Will BTC close between $80k-$90k?"
- [ ] **Custom domain** (lightmarket.app)
- [ ] **Mobile wallet improvements** — WalletConnect v2 support
- [ ] **Move resolver to VPS** — remove dependency on home PC
- [ ] **Resolution criteria templates** — per-category guided creation
- [ ] **Owner dashboard** — fee analytics, dispute queue
- [ ] **Featured markets** — curated by owner
- [ ] **Market search** — find markets by keyword
- [ ] **Confidence scoring** — flag low-confidence AI resolutions

### Phase 3 — Production
- [ ] **Contract redeployment** with protocol fee baked in
- [ ] **N-of-M AI confirmation** for large pool markets
- [ ] **Multi-language support**
- [ ] **API for developers** — create/resolve markets programmatically
- [ ] **Leaderboard** — top predictors on LCAI
- [ ] **Achievements/badges** — gamification layer

### Phase 4 — DAO
- [ ] **DAO governance** — community votes on platform changes
- [ ] **Wyoming DUNA registration**
- [ ] **Hand resolver off to DAO**
- [ ] **LightMarket token (LMKT?)** — governance + fee sharing
- [ ] **Cross-chain markets** — resolve on LCAI, bet on any chain

---

## Alpha Disclaimer

⚠️ LightMarket is alpha software in active development.

- **Not available to US residents**
- AI resolution in active development — verify criteria carefully
- No refunds on resolved markets
- Maximum bet: 10 LCAI during alpha
- Live in-game sports markets may not resolve accurately
- Use at your own risk

---

## Contributing

PRs welcome! Open an issue first to discuss major changes.

---

## License

MIT — Built on LightchainAI 🔥
