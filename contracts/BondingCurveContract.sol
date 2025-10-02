// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRegistry.sol";
import "./libraries/BondingCurve.sol";

contract BondingCurveContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct TokenCurve {
        uint256 soldSupply;
        uint256 somiCollected;
        uint256 virtualSomiReserves;
        uint256 virtualTokenReserves;
        bool graduated;
        bool active;
    }
    
    IRegistry public registry;
    
    mapping(address => TokenCurve) public tokenCurves;
    mapping(address => uint256) public tokenBalances;
    
    uint256 public constant GRADUATION_THRESHOLD = 10000 * 10**18;
    uint256 public constant MAX_SUPPLY_FOR_CURVE = 800_000_000 * 10**18;
    uint256 public constant DEFAULT_VIRTUAL_SOMI = 30 * 10**18;
    uint256 public constant DEFAULT_VIRTUAL_TOKENS = 1_073_000_000 * 10**18;
    uint256 public constant BUY_FEE_PERCENT = 100;
    uint256 public constant SELL_FEE_PERCENT = 100;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    event TokenBought(
        address indexed token,
        address indexed buyer,
        uint256 somiIn,
        uint256 tokensOut,
        uint256 newPrice
    );

    event TokenSold(
        address indexed token,
        address indexed seller,
        uint256 tokensIn,
        uint256 somiOut,
        uint256 newPrice
    );
    
    event CurveParametersUpdated(
        address indexed token,
        uint256 virtualSomiReserves,
        uint256 virtualTokenReserves
    );

    event TokenGraduated(address indexed token, uint256 somiCollected);
    
    modifier onlyValidToken(address token) {
        require(registry.isValidToken(token), "Invalid token");
        require(tokenCurves[token].active, "Curve not active");
        require(!tokenCurves[token].graduated, "Token graduated");
        _;
    }
    
    constructor(address _registry) Ownable(msg.sender) {
        registry = IRegistry(_registry);
    }
    
    function initializeCurve(address token) external {
        require(registry.isValidToken(token), "Invalid token");
        require(!tokenCurves[token].active, "Curve already initialized");
        
        tokenCurves[token] = TokenCurve({
            soldSupply: 0,
            somiCollected: 0,
            virtualSomiReserves: DEFAULT_VIRTUAL_SOMI,
            virtualTokenReserves: DEFAULT_VIRTUAL_TOKENS,
            graduated: false,
            active: true
        });
        
        uint256 initialTokens = IERC20(token).balanceOf(address(this));
        if (initialTokens > 0) {
            tokenBalances[token] = initialTokens;
        }
    }
    
    function getPrice(address token, uint256 amount) external view returns (uint256) {
        TokenCurve memory curve = tokenCurves[token];
        require(curve.active, "Curve not active");
        
        if (curve.graduated) return 0;
        
        uint256 virtualSomi = curve.virtualSomiReserves;
        uint256 virtualTokens = curve.virtualTokenReserves - curve.soldSupply;

        if (virtualTokens == 0 || amount == 0) return 0;

        return (virtualSomi * amount) / virtualTokens;
    }
    
    function buyTokens(address token, address user, uint256 somiAmount)
        external
        payable
        nonReentrant
        onlyValidToken(token)
        returns (uint256)
    {
        require(msg.value == somiAmount, "Incorrect SOMI amount");
        require(somiAmount > 0, "Amount must be greater than 0");

        TokenCurve storage curve = tokenCurves[token];

        uint256 fee = (somiAmount * BUY_FEE_PERCENT) / FEE_DENOMINATOR;
        uint256 somiAfterFee = somiAmount - fee;

        uint256 tokensOut = BondingCurve.calculateTokensOut(somiAfterFee, curve.soldSupply);
        require(tokensOut > 0, "No tokens available");
        require(curve.soldSupply + tokensOut <= MAX_SUPPLY_FOR_CURVE, "Exceeds curve limit");

        curve.soldSupply += tokensOut;
        curve.somiCollected += somiAfterFee;

        require(tokenBalances[token] >= tokensOut, "Insufficient token balance");
        tokenBalances[token] -= tokensOut;

        IERC20(token).safeTransfer(user, tokensOut);

        address feeManager = registry.getFeeManager();
        if (feeManager != address(0) && fee > 0) {
            (bool success, ) = feeManager.call{value: fee}("");
            require(success, "Fee manager transfer failed");
        }

        uint256 newPrice = BondingCurve.calculatePrice(curve.soldSupply);
        emit TokenBought(token, user, somiAmount, tokensOut, newPrice);

        if (curve.somiCollected >= GRADUATION_THRESHOLD) {
            _graduateToken(token);
        }

        return tokensOut;
    }
    
    function sellTokens(address token, address user, uint256 tokenAmount)
        external
        nonReentrant
        onlyValidToken(token)
        returns (uint256)
    {
        require(tokenAmount > 0, "Amount must be greater than 0");

        TokenCurve storage curve = tokenCurves[token];
        require(tokenAmount <= curve.soldSupply, "Cannot sell more than sold");

        uint256 somiOut = BondingCurve.calculateSomiOut(tokenAmount, curve.soldSupply);
        require(somiOut > 0, "No SOMI to receive");

        uint256 fee = (somiOut * SELL_FEE_PERCENT) / FEE_DENOMINATOR;
        uint256 somiAfterFee = somiOut - fee;

        require(address(this).balance >= somiOut, "Insufficient SOMI balance");

        curve.soldSupply -= tokenAmount;
        curve.somiCollected -= somiOut;

        IERC20(token).safeTransferFrom(user, address(this), tokenAmount);
        tokenBalances[token] += tokenAmount;

        address feeManager = registry.getFeeManager();
        if (feeManager != address(0) && fee > 0) {
            (bool success, ) = feeManager.call{value: fee}("");
            require(success, "Fee manager transfer failed");
        }

        payable(user).transfer(somiAfterFee);

        uint256 newPrice = BondingCurve.calculatePrice(curve.soldSupply);
        emit TokenSold(token, user, tokenAmount, somiAfterFee, newPrice);

        return somiAfterFee;
    }
    
    function updateCurveParameters(
        address token,
        uint256 virtualSomiReserves,
        uint256 virtualTokenReserves
    ) external onlyOwner {
        require(tokenCurves[token].active, "Curve not active");
        require(!tokenCurves[token].graduated, "Token graduated");
        require(virtualSomiReserves > 0 && virtualTokenReserves > 0, "Invalid parameters");

        TokenCurve storage curve = tokenCurves[token];
        curve.virtualSomiReserves = virtualSomiReserves;
        curve.virtualTokenReserves = virtualTokenReserves;

        emit CurveParametersUpdated(token, virtualSomiReserves, virtualTokenReserves);
    }
    
    function _graduateToken(address token) internal {
        TokenCurve storage curve = tokenCurves[token];
        curve.graduated = true;

        emit TokenGraduated(token, curve.somiCollected);

        address marketGraduation = registry.getMarketGraduation();
        if (marketGraduation != address(0)) {
            uint256 tokenBalance = tokenBalances[token];
            if (tokenBalance > 0) {
                IERC20(token).safeTransfer(marketGraduation, tokenBalance);
                tokenBalances[token] = 0;
            }

            uint256 somiToTransfer = curve.somiCollected;

            (bool success, ) = marketGraduation.call{value: somiToTransfer}(
                abi.encodeWithSignature("graduateToken(address)", token)
            );
            require(success, "Graduation call failed");
        }
    }
    
    function getCurveInfo(address token) external view returns (TokenCurve memory) {
        return tokenCurves[token];
    }
    
    function getTokenBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }
    
    receive() external payable {}
}