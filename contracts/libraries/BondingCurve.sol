// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library BondingCurve {
    uint256 public constant GRADUATION_THRESHOLD = 10000 * 10**18;
    uint256 public constant MAX_SUPPLY_FOR_CURVE = 800_000_000 * 10**18;
    uint256 public constant DEFAULT_VIRTUAL_SOMI = 30 * 10**18;
    uint256 public constant DEFAULT_VIRTUAL_TOKENS = 1_073_000_000 * 10**18;

    function calculateTokensOut(uint256 somiAmount, uint256 soldSupply)
        internal
        pure
        returns (uint256)
    {
        if (somiAmount == 0) return 0;
        if (soldSupply >= MAX_SUPPLY_FOR_CURVE) return 0;

        uint256 currentPrice = calculatePrice(soldSupply);
        if (currentPrice == 0) currentPrice = 1e12;

        uint256 tokensOut = (somiAmount * 1e18) / currentPrice;

        if (soldSupply + tokensOut > MAX_SUPPLY_FOR_CURVE) {
            tokensOut = MAX_SUPPLY_FOR_CURVE - soldSupply;
        }

        return tokensOut;
    }

    function calculateSomiOut(uint256 tokenAmount, uint256 soldSupply)
        internal
        pure
        returns (uint256)
    {
        if (tokenAmount == 0 || tokenAmount > soldSupply) return 0;

        uint256 newSupply = soldSupply - tokenAmount;
        uint256 averagePrice = (calculatePrice(newSupply) + calculatePrice(soldSupply)) / 2;

        return (tokenAmount * averagePrice) / 1e18;
    }

    function calculatePrice(uint256 soldSupply)
        internal
        pure
        returns (uint256)
    {
        uint256 basePrice = 1e12;
        uint256 priceIncrement = (soldSupply / 1e24) * 1e12;
        return basePrice + priceIncrement;
    }

    function canGraduate(uint256 somiRaised)
        internal
        pure
        returns (bool)
    {
        return somiRaised >= GRADUATION_THRESHOLD;
    }

    function calculateMarketCap(uint256 soldSupply, uint256 totalSupply)
        internal
        pure
        returns (uint256)
    {
        uint256 currentPrice = calculatePrice(soldSupply);
        return (totalSupply * currentPrice) / 1e18;
    }
}