# Somnia.fun - Token Launchpad

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)           │
├─────────────────────────────────────────────────────────────────┤
│  Landing Page  │  Token Board  │  Token Detail  │  Somnex DEX   │
│      │         │      │        │       │        │       │       │
│      └─────────┼──────┼────────┼───────┼────────┼───────┘       │
│                │      │        │       │        │               │
└────────────────┼──────┼────────┼───────┼────────┼───────────────┘
                 │      │        │       │        │
┌────────────────┼──────┼────────┼───────┼────────┼───────────────┐
│                           WAGMI + VIEM                          │
└────────────────┼──────┼────────┼───────┼────────┼───────────────┘
                 │      │        │       │        │
┌────────────────┼──────┼────────┼───────┼────────┼───────────────┐
│                      SOMNIA BLOCKCHAIN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Registry  │◄───┤  Token Factory  │    │  Bonding Curve  │ │
│  │             │    │                 │    │                 │ │
│  │ ┌─────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │ │
│  │ │Contract │ │    │ │ MemeToken   │ │    │ │ Price       │ │ │
│  │ │Address  │ │    │ │ Deployment  │ │    │ │ Discovery   │ │ │
│  │ │Registry │ │    │ │             │ │    │ │             │ │ │
│  │ └─────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │ │
│  └─────────────┘    └─────────────────┘    └─────────────────┘ │
│           │                   │                         │      │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │Fee Manager  │    │  User Manager   │    │Market Graduation│ │
│  │             │    │                 │    │                 │ │
│  │ ┌─────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │ │
│  │ │ Fee     │ │    │ │ Access      │ │    │ │ DEX         │ │ │
│  │ │ Collection│ │   │ │ Control     │ │    │ │ Graduation  │ │ │
│  │ │         │ │    │ │             │ │    │ │             │ │ │
│  │ └─────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │ │
│  └─────────────┘    └─────────────────┘    └─────────────────┘ │
│           │                   │                         │      │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │Liquidity    │    │ Somnex          │    │      WSTT       │ │
│  │Pool         │    │ Integration     │    │   (Wrapper)     │ │
│  │             │    │                 │    │                 │ │
│  │ ┌─────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │ │
│  │ │ Pool    │ │    │ │ DEX         │ │    │ │ STT         │ │ │
│  │ │Management│ │    │ │ Integration │ │    │ │ Wrapping    │ │ │
│  │ │         │ │    │ │             │ │    │ │             │ │ │
│  │ └─────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │ │
│  └─────────────┘    └─────────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Smart Contract System

### Core Contracts

#### Registry Contract
- **Address:** `0x5ED23A5b8f76E202De46a608a66e6FE25060f4A6`
- **Purpose:** Central registry for all contract addresses and token validation
- **Key Functions:**
  - `registerToken()` - Register new tokens
  - `isValidToken()` - Validate token legitimacy
  - `getContract()` - Retrieve contract addresses

#### Token Factory Contract
- **Address:** `0x1A42907c51923D98EF39A25C28ffCe06dbA90517`
- **Purpose:** Deploy new ERC-20 meme tokens
- **Key Functions:**
  - `createToken()` - Deploy new token with metadata
  - `getAllTokens()` - Retrieve all deployed tokens
  - `getTokenInfo()` - Get token metadata

#### Bonding Curve Contract
- **Address:** `0x02017137623069af9D1De88A20e4c589c781F9ae`
- **Purpose:** Price discovery mechanism for new tokens
- **Key Functions:**
  - `buyTokens()` - Purchase tokens via bonding curve
  - `sellTokens()` - Sell tokens back to curve
  - `getPrice()` - Get current token price
  - `getCurveInfo()` - Retrieve curve state

#### Market Graduation Contract
- **Address:** `0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E`
- **Purpose:** Manage token graduation to DEX
- **Key Functions:**
  - `checkGraduation()` - Check if token can graduate
  - `graduateToken()` - Graduate token to DEX
  - `listOnDEX()` - Create DEX liquidity pool

### Supporting Contracts

#### User Manager Contract
- **Address:** `0x7a16afFcE6d068192da5A3D92cB99654cBAA1075`
- **Purpose:** Access control and user permissions

#### Fee Manager Contract
- **Address:** `0x6Ee33E77667e9984131E59f96CE275B92DC4638E`
- **Purpose:** Fee collection and reward distribution

#### Liquidity Pool Contract
- **Address:** `0xc805b0eF722B850b19923172b0CDCA705e0e7f6f`
- **Purpose:** Manage liquidity pools for graduated tokens

#### Somnex Integration Contract
- **Address:** `0xb9563C346537427aa41876aa4720902268dCdB40`
- **Purpose:** Integration with Somnex DEX for token graduation

#### WSTT Contract
- **Address:** `0xa959A269696cEd243A0E2Cc45fCeD8c0A24dB88e`
- **Purpose:** Wrapped STT for DEX compatibility

## Token Lifecycle

### 1. Creation Phase
- User pays 0.1 STT creation fee
- Token Factory deploys new ERC-20 contract
- 1B tokens minted to Bonding Curve contract
- Token registered in Registry
- Bonding curve initialized

### 2. Trading Phase
- Users buy/sell tokens through bonding curve
- Price increases with each purchase (bonding curve mechanics)
- Platform fees collected (1% to platform, 1% to creator)
- Progress tracked toward graduation threshold

### 3. Graduation Phase
- Triggered when 1000 STT is raised
- Market Graduation contract validates eligibility
- Token graduates to Somnex DEX
- 36 STT permanently locked as liquidity
- Remaining liquidity transferred to DEX pool

## Network Configuration

### Mainnet
- **Chain ID:** 5031
- **RPC URL:** `https://api.infra.mainnet.somnia.network/`
- **Currency:** SOMI
- **Explorer:** `https://explorer.somnia.network`

### Testnet
- **Chain ID:** 50312
- **RPC URL:** `https://dream-rpc.somnia.network/`
- **Currency:** STT
- **Explorer:** `https://shannon-explorer.somnia.network/`

## Test Results

### Deployment Verification
✅ All contracts successfully deployed to Somnia Testnet
✅ Registry initialized with all contract addresses
✅ Inter-contract communication verified
✅ Network configuration validated

### Token Creation Test
✅ **Token Created:** Somnia Test Token (STEST)
✅ **Contract Address:** `0x9F954FFe9e14078BAfC96533335485C2D70D11b0`
✅ **Transaction Hash:** `0xca9eff1c35900f8608fdbe25c5385501ee10c7edbf21e82e4ce12958da7e8d1b`
✅ **Gas Used:** 20,609,022
✅ **Total Supply:** 1,000,000,000 STEST

### Trading System Test
✅ **Bonding Curve Initialized:** Active and functional
✅ **Token Purchase Executed:** 10,000 STEST bought with 0.01 STT
✅ **Transaction Hash:** `0x2e11e99a9d92ee6b6b67f1df041a0de1091fdecec277e003c68b69bec4c00bb6`
✅ **Price Discovery:** Dynamic pricing confirmed
✅ **Balance Updates:** Verified token transfer to user

### Frontend Integration Test
✅ **Wallet Connection:** Somnia Testnet enforced
✅ **Network Validation:** Wrong network prevention active
✅ **Token Creation UI:** Functional with real blockchain deployment
✅ **Trading Interface:** Buy/sell operations working
✅ **Navigation:** All links and filters operational

### Graduation System Test
✅ **Threshold Detection:** 1000 STT graduation threshold configured
✅ **Somnex Integration:** DEX graduation contracts deployed
✅ **Liquidity Locking:** 36 STT permanent lock mechanism ready
✅ **Market Graduation:** Contract validates graduation eligibility

## Technical Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 7.1.4
- **Web3 Integration:** Wagmi + Viem
- **UI Components:** Custom design system with Tailwind CSS
- **State Management:** React hooks and context

### Smart Contracts
- **Language:** Solidity ^0.8.20
- **Development:** Hardhat framework
- **Libraries:** OpenZeppelin contracts
- **Optimization:** Via IR compilation, 200 optimization runs

### Blockchain
- **Network:** Somnia Blockchain
- **Consensus:** Proof of Stake
- **Transaction Finality:** ~3-5 seconds
- **Block Explorer:** Shannon Explorer

## Security Features

### Smart Contract Security
- **Reentrancy Protection:** All state-changing functions protected
- **Access Control:** Role-based permissions via OpenZeppelin
- **Input Validation:** Comprehensive parameter validation
- **Integer Overflow:** Solidity ^0.8.20 built-in protection

### Frontend Security
- **Network Enforcement:** Prevents transactions on wrong networks
- **Input Sanitization:** All user inputs validated
- **Connection Validation:** Wallet state verification
- **Error Handling:** Graceful error management and user feedback

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npx hardhat compile  # Compile smart contracts
npx hardhat test     # Run smart contract tests
```

## License

MIT License