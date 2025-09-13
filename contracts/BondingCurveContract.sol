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
        uint256 sttCollected;
        uint256 virtualSttReserves;
        uint256 virtualTokenReserves;
        bool graduated;
        bool active;
    }
    
    IRegistry public registry;
    
    mapping(address => TokenCurve) public tokenCurves;
    mapping(address => uint256) public tokenBalances;
    
    uint256 public constant GRADUATION_THRESHOLD = 80 * 10**18;
    uint256 public constant MAX_SUPPLY_FOR_CURVE = 800_000_000 * 10**18;
    uint256 public constant DEFAULT_VIRTUAL_STT = 30 * 10**18;
    uint256 public constant DEFAULT_VIRTUAL_TOKENS = 1_073_000_000 * 10**18;
    
    event TokenBought(
        address indexed token,
        address indexed buyer,
        uint256 sttIn,
        uint256 tokensOut,
        uint256 newPrice
    );
    
    event TokenSold(
        address indexed token,
        address indexed seller,
        uint256 tokensIn,
        uint256 sttOut,
        uint256 newPrice
    );
    
    event CurveParametersUpdated(
        address indexed token,
        uint256 virtualSttReserves,
        uint256 virtualTokenReserves
    );
    
    event TokenGraduated(address indexed token, uint256 sttCollected);
    
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
            sttCollected: 0,
            virtualSttReserves: DEFAULT_VIRTUAL_STT,
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
        
        uint256 virtualStt = curve.virtualSttReserves;
        uint256 virtualTokens = curve.virtualTokenReserves - curve.soldSupply;
        
        if (virtualTokens == 0 || amount == 0) return 0;
        
        return (virtualStt * amount) / virtualTokens;
    }
    
    function buyTokens(address token, address user, uint256 sttAmount) 
        external 
        payable 
        nonReentrant 
        onlyValidToken(token) 
        returns (uint256) 
    {
        require(msg.value == sttAmount, "Incorrect STT amount");
        require(sttAmount > 0, "Amount must be greater than 0");
        
        TokenCurve storage curve = tokenCurves[token];
        
        uint256 tokensOut = BondingCurve.calculateTokensOut(sttAmount, curve.soldSupply);
        require(tokensOut > 0, "No tokens available");
        require(curve.soldSupply + tokensOut <= MAX_SUPPLY_FOR_CURVE, "Exceeds curve limit");
        
        curve.soldSupply += tokensOut;
        curve.sttCollected += sttAmount;
        
        require(tokenBalances[token] >= tokensOut, "Insufficient token balance");
        tokenBalances[token] -= tokensOut;
        
        IERC20(token).safeTransfer(user, tokensOut);
        
        address feeManager = registry.getFeeManager();
        if (feeManager != address(0)) {
            (bool success, ) = feeManager.call{value: sttAmount}("");
            require(success, "Fee manager transfer failed");
        }
        
        uint256 newPrice = BondingCurve.calculatePrice(curve.soldSupply);
        emit TokenBought(token, user, sttAmount, tokensOut, newPrice);
        
        if (curve.sttCollected >= GRADUATION_THRESHOLD) {
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
        
        uint256 sttOut = BondingCurve.calculateSttOut(tokenAmount, curve.soldSupply);
        require(sttOut > 0, "No STT to receive");
        require(address(this).balance >= sttOut, "Insufficient STT balance");
        
        curve.soldSupply -= tokenAmount;
        curve.sttCollected -= sttOut;
        
        IERC20(token).safeTransferFrom(user, address(this), tokenAmount);
        tokenBalances[token] += tokenAmount;
        
        address feeManager = registry.getFeeManager();
        if (feeManager != address(0)) {
            (bool success, ) = feeManager.call{value: sttOut}("");
            require(success, "Fee manager transfer failed");
        } else {
            payable(user).transfer(sttOut);
        }
        
        uint256 newPrice = BondingCurve.calculatePrice(curve.soldSupply);
        emit TokenSold(token, user, tokenAmount, sttOut, newPrice);
        
        return sttOut;
    }
    
    function updateCurveParameters(
        address token,
        uint256 virtualSttReserves,
        uint256 virtualTokenReserves
    ) external onlyOwner {
        require(tokenCurves[token].active, "Curve not active");
        require(!tokenCurves[token].graduated, "Token graduated");
        require(virtualSttReserves > 0 && virtualTokenReserves > 0, "Invalid parameters");
        
        TokenCurve storage curve = tokenCurves[token];
        curve.virtualSttReserves = virtualSttReserves;
        curve.virtualTokenReserves = virtualTokenReserves;
        
        emit CurveParametersUpdated(token, virtualSttReserves, virtualTokenReserves);
    }
    
    function _graduateToken(address token) internal {
        TokenCurve storage curve = tokenCurves[token];
        curve.graduated = true;
        
        emit TokenGraduated(token, curve.sttCollected);
        
        address marketGraduation = registry.getMarketGraduation();
        if (marketGraduation != address(0)) {
            (bool success, ) = marketGraduation.call(
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