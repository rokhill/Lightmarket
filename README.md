# ⚡ LightMarket

**The first AI-native prediction market on LightchainAI.**

Every outcome is resolved by verifiable on-chain LCAI inference — no human oracles, no manual resolution, no trust required.

🌐 **Live dApp:** https://lightmarket-frontend.vercel.app  
📦 **dApp Hub:** https://hub.lightchain.ai  
🔗 **Explorer:** https://mainnet.lightscan.app  
🐛 **Report Issues:** https://github.com/rokhill/Lightmarket/issues  
💬 **Community:** LCAI Discord `#lightmarket` channel  

---

## What is LightMarket?

LightMarket is a decentralized prediction market built natively on the LightchainAI (LCAI) blockchain. Users create YES/NO prediction markets on any topic — crypto prices, sports results, current events, weather, politics, AI developments, and more. When a market closes, the outcome is automatically determined by native LCAI AI inference and anchored on-chain with a Proof of Inference (PoI) attestation.

**No human oracles. No manual resolution. Every result is verifiable on-chain.**

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
Join the LCAI Discord and post in `#lightmarket` channel.

**When reporting please include:**
- Market ID (shown on every card as "Market #N")
- Expected outcome vs actual outcome
- Your wallet address
- TX hash if available

---

## AI Resolution Engine

### Three-Tier Resolution
1. **LCAI Inference (Primary)** — native on-chain AI workers (3 retry attempts, 3 min timeout each)
2. **Groq Sanity Check (Secondary)** — verification layer using real-time data
3. **Decision Logic:**
   - LCAI + Groq agree → resolve with confidence ✅
   - LCAI + Groq disagree → trust LCAI, flag for human review ⚠️
   - Only LCAI answers → resolve with LCAI
   - Only Groq answers → resolve with Groq fallback
   - Both fail → flag as unresolvable, owner reviews

### Real-Time Data APIs
The resolver enriches every prompt with live data before sending to LCAI:

| API | Data | Key Required |
|-----|------|-------------|
| Binance | BTC, ETH, SOL prices | No |
| CoinGecko | LCAI price, trending | No |
| CryptoCompare | BTC, ETH fallback | No |
| CoinCap | Crypto backup prices | No |
| Open-Meteo | Weather for 10+ cities | No |
| Tavily | Web search, current events | Yes |
| TheSportsDB | Sports results, team data | No |
| ESPN | NFL, NBA, MLB, NHL scores | No |
| Ball Don't Lie | NBA stats | No |
| Alpha Vantage | Stock prices | Yes |
| NewsAPI | Current headlines | Yes |
| Wikipedia | Facts verification | No |
| World Bank | Economic data | No |

### Crypto Price Markets
BTC, ETH, SOL, and LCAI markets bypass AI and use direct price API comparison for maximum accuracy. Supports both "above" and "below" price detection.

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
| Winner Fee | 1% of pool | Contract |

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
```bash
cd resolver
cp .env.example .env
# Fill in your private key and API keys
npm install
node index.js
```

### Environment Variables (Resolver)
```
RESOLVER_PRIVATE_KEY=your_wallet_private_key
LCAI_RPC=https://rpc.mainnet.lightchain.ai
LIGHTMARKET_ADDRESS=0xa20f046945a362b713695BEC3896cedC954CF55A
AIRESOLVER_ADDRESS=0x035a5e662eF1B9379A96eD3D19fCb8Bc74680597
JOBREGISTRY_ADDRESS=0xfB15F90298e4CcD7106E76fFB5e520315cC42B0b
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
ALPHA_VANTAGE_KEY=your_alpha_vantage_key
NEWS_API_KEY=your_newsapi_key
```

---

## Roadmap

### Phase 1 — Alpha (Current ✅)
- ✅ Core YES/NO prediction market contracts
- ✅ Native LCAI inference resolution
- ✅ Three-tier resolution (LCAI + Groq)
- ✅ Multi-API real-time data enrichment
- ✅ Frontend dApp on Vercel
- ✅ Market categories with emoji badges
- ✅ User profile with bet history
- ✅ Owner manual resolve + cancel
- ✅ Human review request system
- ✅ Report market button
- ✅ Market creation fee (1 LCAI)
- ✅ dApp Hub listing
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
