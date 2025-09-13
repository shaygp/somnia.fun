// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library BondingCurve {
    uint256 public constant GRADUATION_THRESHOLD = 80 * 10**18; // 80 STT
    uint256 public constant MAX_SUPPLY_FOR_CURVE = 800_000_000 * 10**18; // 800M tokens
    uint256 public constant DEFAULT_VIRTUAL_STT = 30 * 10**18; // 30 STT
    uint256 public constant DEFAULT_VIRTUAL_TOKENS = 1_073_000_000 * 10**18; // 1.073B tokens

    /**
     * @dev Calculate tokens out for a given STT amount using bonding curve formula
     * Price increases as more tokens are sold
     */
    function calculateTokensOut(uint256 sttAmount, uint256 soldSupply) 
        internal 
        pure 
        returns (uint256) 
    {
        if (sttAmount == 0) return 0;
        if (soldSupply >= MAX_SUPPLY_FOR_CURVE) return 0;
        
        // Simple bonding curve: price = (soldSupply / 1e6) * 1e18
        // More sophisticated curves could be implemented here
        uint256 currentPrice = calculatePrice(soldSupply);
        if (currentPrice == 0) currentPrice = 1e12; // minimum price
        
        uint256 tokensOut = (sttAmount * 1e18) / currentPrice;
        
        // Ensure we don't exceed max supply
        if (soldSupply + tokensOut > MAX_SUPPLY_FOR_CURVE) {
            tokensOut = MAX_SUPPLY_FOR_CURVE - soldSupply;
        }
        
        return tokensOut;
    }

    /**
     * @dev Calculate STT out for a given token amount
     */
    function calculateSttOut(uint256 tokenAmount, uint256 soldSupply) 
        internal 
        pure 
        returns (uint256) 
    {
        if (tokenAmount == 0 || tokenAmount > soldSupply) return 0;
        
        // Calculate price at current supply minus the tokens being sold
        uint256 newSupply = soldSupply - tokenAmount;
        uint256 averagePrice = (calculatePrice(newSupply) + calculatePrice(soldSupply)) / 2;
        
        return (tokenAmount * averagePrice) / 1e18;
    }

    /**
     * @dev Calculate current price based on sold supply
     * Price formula: base_price + (sold_supply / price_increment_factor)
     */
    function calculatePrice(uint256 soldSupply) 
        internal 
        pure 
        returns (uint256) 
    {
        // Base price: 0.000001 STT
        uint256 basePrice = 1e12;
        
        // Price increment: increases by 1e12 per 1M tokens sold
        uint256 priceIncrement = (soldSupply / 1e24) * 1e12;
        
        return basePrice + priceIncrement;
    }

    /**
     * @dev Check if token can graduate to DEX
     */
    function canGraduate(uint256 sttRaised) 
        internal 
        pure 
        returns (bool) 
    {
        return sttRaised >= GRADUATION_THRESHOLD;
    }

    /**
     * @dev Calculate market cap based on current price and supply
     */
    function calculateMarketCap(uint256 soldSupply, uint256 totalSupply) 
        internal 
        pure 
        returns (uint256) 
    {
        uint256 currentPrice = calculatePrice(soldSupply);
        return (totalSupply * currentPrice) / 1e18;
    }
}