# Somnia.fun

A pump.fun meme token launchpad built for Somnia. Deploy tokens instantly, trade on bonding curves and graduate to DEX when hitting 80 STT market cap.

## Architecture

```
somnia.fun/
├── contracts/           # Solidity smart contracts
│   ├── BondingCurveContract.sol    # AMM + pricing logic
│   ├── MarketGraduation.sol        # DEX graduation system
│   ├── FeeManager.sol              # Fee collection/distribution
│   ├── UserManagement.sol          # User profiles/social
│   └── MemeToken.sol               # ERC20 token implementation
├── src/                 # React frontend
│   ├── components/      # UI components (Radix + Tailwind)
│   ├── hooks/          # Web3 hooks (Wagmi)
│   ├── pages/          # Route components
│   └── config/         # Contract addresses + network config
└── test/               # Hardhat tests
```

## Smart Contract Flow

### Token Creation
```solidity
function createToken(
    string memory name,
    string memory symbol,
    string memory description,
    string memory imageUri
) external returns (address tokenAddress)
```

### Bonding Curve Trading
```solidity
// Price calculation using bonding curve math
price = virtualSttReserves / (virtualTokenReserves - tokensOut)

// Buy tokens with STT
function buyTokens(address token, uint256 minTokensOut) 
    external payable returns (uint256 tokensOut)

// Sell tokens for STT
function sellTokens(address token, uint256 tokensIn, uint256 minSttOut)
    external returns (uint256 sttOut)
```

### Graduation Logic
```solidity
// Auto-graduate when bonding curve collects 80 STT
if (tokenCurves[token].sttCollected >= GRADUATION_THRESHOLD) {
    _graduateToken(token);
}
```

## Frontend Stack

### Core Dependencies
```json
{
  "react": "^19.1.1",
  "wagmi": "^2.16.9",
  "viem": "^2.37.1",
  "@tanstack/react-query": "^5.85.9"
}
```

### Hooks
```typescript
// Contract interaction
const { createToken, buyTokens, sellTokens } = usePumpFun();

// Wallet connection
const { address, isConnected } = useAccount();

// Transaction monitoring
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
```

### Component Structure
```typescript
// Token creation form
<TokenCreationForm onSubmit={handleCreateToken} />

// Trading interface  
<TradingCard 
  token={tokenAddress}
  onBuy={handleBuy}
  onSell={handleSell}
/>

// Price chart
<PriceChart data={priceHistory} />

// Wallet connector
<WalletConnection />
```

## Development Setup

### Install & Run
```bash
git clone https://github.com/shaygp/somnia.fun.git
cd somnia.fun
npm install

# Frontend dev server
npm run dev

# Compile contracts
npm run compile

# Run tests
npm test
```

### Deploy Contracts
```bash
# X Layer testnet
npm run deploy:testnet

# X Layer mainnet  
npm run deploy:somnia

# Verify contracts
npm run verify
```

### Environment Config
```bash
# .env
PRIVATE_KEY=your_private_key
SOMNIA_RPC_URL=https://dream.somnia.network
ETHERSCAN_API_KEY=your_api_key
```

## Contract Constants

```solidity
uint256 public constant GRADUATION_THRESHOLD = 80 * 10**18;      // 80 STT
uint256 public constant MAX_SUPPLY_FOR_CURVE = 800_000_000 * 10**18;
uint256 public constant DEFAULT_VIRTUAL_STT = 30 * 10**18;
uint256 public constant DEFAULT_VIRTUAL_TOKENS = 1_073_000_000 * 10**18;
```

## Events

```solidity
event TokenCreated(address indexed token, address indexed creator, string name, string symbol);
event TokenBought(address indexed token, address indexed buyer, uint256 sttIn, uint256 tokensOut);
event TokenSold(address indexed token, address indexed seller, uint256 tokensIn, uint256 sttOut);
event TokenGraduated(address indexed token, uint256 timestamp);
```

## Integration

### Connect to X Layer
```typescript
const config = createConfig({
  chains: [somnia],
  transports: {
    [somnia.id]: http('https://dream.somnia.network'),
  },
});
```

### Contract Addresses
```typescript
export const CONTRACTS = {
  BONDING_CURVE: '0x...',
  FEE_MANAGER: '0x...',
  USER_MANAGEMENT: '0x...',
  MARKET_GRADUATION: '0x...',
} as const;
```

This product was developed by Hashf0x Labs.
