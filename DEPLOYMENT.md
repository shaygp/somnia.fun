# Somnia.fun Deployment Guide

## Prerequisites

1. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

2. **Configure `.env` file:**
   ```env
   PRIVATE_KEY=your_wallet_private_key_here
   SOMNIA_API_KEY=your_explorer_api_key_if_available
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

## Deployment Steps

### 1. Check Wallet Balance

Before deploying, ensure you have enough SOMI for gas fees:

```bash
npx hardhat run scripts/checkWallet.cjs --network somnia
```

**Recommended Balance:** At least 100 SOMI for deployment and initial operations.

### 2. Deploy All Contracts

Deploy the complete system to Somnia Mainnet:

```bash
npx hardhat run scripts/deploy.cjs --network somnia
```

This will deploy in order:
1. Registry
2. TokenFactory
3. BondingCurveContract
4. MarketGraduation
5. FeeManager
6. Configure all contracts in Registry

### 3. Update Frontend Configuration

After deployment completes, copy the contract addresses from the output and update `src/config/networks.ts`:

```typescript
mainnet: {
  REGISTRY: '0x...',           // From deployment output
  TOKEN_FACTORY: '0x...',      // From deployment output
  BONDING_CURVE: '0x...',      // From deployment output
  MARKET_GRADUATION: '0x...',  // From deployment output
  FEE_MANAGER: '0x...',        // From deployment output
  WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
  SOMNEX_FACTORY: '0x46C6FBD364325aE500d1A5a3A7A32B34ec5c5e73',
  SOMNEX_ROUTER: '0x28783c7Af9bCF35cA9b5417077daBcB274D64537',
}
```

### 4. Verify Deployment

Check that contracts are deployed correctly:

```bash
# Check Registry
npx hardhat console --network somnia
> const Registry = await ethers.getContractFactory("Registry");
> const registry = await Registry.attach("YOUR_REGISTRY_ADDRESS");
> await registry.getTokenFactory();
> await registry.getBondingCurve();
> await registry.getMarketGraduation();
```

### 5. Test Token Creation

Create a test token to verify the system works:

1. Go to your frontend: `https://somnia.fun`
2. Connect wallet (ensure on Somnia Mainnet)
3. Create a token (costs 10 SOMI)
4. Verify token appears in the list
5. Test buy/sell functionality

## Contract Overview

### Core Contracts

- **Registry** - Central registry for all contract addresses
- **TokenFactory** - Creates new meme tokens
- **BondingCurveContract** - Handles buy/sell with bonding curve pricing
- **MarketGraduation** - Manages graduation to Somnex DEX
- **FeeManager** - Collects and manages fees

### External Integrations

- **WSOMI** - Wrapped SOMI token (pre-deployed)
- **Somnex Factory** - DEX factory (pre-deployed)
- **Somnex Router** - DEX router (pre-deployed)

## Important Parameters

### Token Creation
- Creation Fee: 10 SOMI
- Initial Supply: 1,000,000,000 tokens
- Tokens to Curve: 800,000,000 (80%)
- Tokens to Treasury: 35,000,000 (3.5%)

### Trading Fees
- Buy Fee: 1%
- Sell Fee: 1%

### Graduation
- Threshold: 10,000 SOMI raised
- Graduation Fee: 200 SOMI
- Locked Liquidity: 15,000 SOMI + 200M tokens
- LP Tokens: Locked permanently in MarketGraduation

## Troubleshooting

### Deployment Fails

**Issue:** Insufficient funds
```
Solution: Add more SOMI to deployer wallet
```

**Issue:** Contract verification fails
```
Solution: Verification can be done manually later via block explorer
```

### Frontend Issues

**Issue:** Wrong network detected
```
Solution: Ensure src/config/contracts.ts has isTestnet = false
```

**Issue:** Contract addresses not found
```
Solution: Double-check addresses in src/config/networks.ts
```

## Post-Deployment Checklist

- [ ] All 5 contracts deployed successfully
- [ ] Registry configured with all contract addresses
- [ ] Frontend updated with new contract addresses
- [ ] Test token creation works
- [ ] Test buy/sell works
- [ ] Verify contracts on block explorer
- [ ] Monitor treasury address for fees

## Network Information

**Somnia Mainnet:**
- Chain ID: 5031
- RPC: https://api.infra.mainnet.somnia.network/
- Explorer: https://explorer.somnia.network
- Currency: SOMI

## Security Notes

1. **Private Key Security**
   - Never commit `.env` file
   - Use hardware wallet for mainnet deployments
   - Keep deployer key secure (becomes contract owner)

2. **Treasury Address**
   - Deployment script uses deployer address as treasury
   - Can be changed later via contract ownership functions
   - All fees (creation fees, trading fees) go to treasury

3. **Contract Ownership**
   - Deployer becomes owner of all contracts
   - Owner can update parameters and addresses
   - Transfer ownership if needed after deployment

## Support

For issues or questions:
- Check transaction on explorer: https://explorer.somnia.network
- Verify contract addresses match frontend config
- Ensure wallet is on Somnia Mainnet (Chain 5031)
