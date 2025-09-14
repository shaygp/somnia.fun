// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IQuickSwap.sol";
import "./MemeToken.sol";
import "./WSTT.sol";

contract MarketGraduation is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct GraduationInfo {
        bool graduated;
        bool publicTradingEnabled;
        uint256 graduatedAt;
        uint256 sttLocked;
        uint256 tokensLocked;
        address poolAddress;
        uint256 lpTokenId;
    }
    
    IRegistry public registry;
    
    mapping(address => GraduationInfo) public graduationInfo;
    
    uint256 public constant GRADUATION_THRESHOLD = 1000 * 10**18;
    uint256 public constant LOCKED_LIQUIDITY_STT = 36 * 10**18;
    uint256 public constant LOCKED_LIQUIDITY_TOKENS = 200_000_000 * 10**18;
    uint256 public constant MIN_LIQUIDITY_RATIO = 100;
    
    address public constant QUICKSWAP_FACTORY = 0xd2480162Aa7F02Ead7BF4C127465446150D58452;
    address public constant QUICKSWAP_POSITION_MANAGER = 0xF6Ad3CcF71Abb3E12beCf6b3D2a74C963859ADCd;
    uint24 public constant POOL_FEE = 3000;
    
    event TokenGraduated(
        address indexed token,
        address indexed pool,
        uint256 sttLocked,
        uint256 tokensLocked
    );
    
    event PublicTradingEnabled(address indexed token);
    event LiquidityLocked(address indexed token, uint256 lpTokenId);
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner() ||
            msg.sender == registry.getBondingCurve(),
            "Not authorized"
        );
        _;
    }
    
    constructor(address _registry) Ownable(msg.sender) {
        registry = IRegistry(_registry);
    }
    
    function checkGraduation(address token) external view returns (bool canGraduate, uint256 sttCollected) {
        require(registry.isValidToken(token), "Invalid token");
        
        if (graduationInfo[token].graduated) {
            return (false, 0);
        }
        
        address bondingCurve = registry.getBondingCurve();
        (bool success, bytes memory data) = bondingCurve.staticcall(
            abi.encodeWithSignature("getCurveInfo(address)", token)
        );
        
        if (!success) {
            return (false, 0);
        }
        
        (, , uint256 collected, , , ) = abi.decode(
            data,
            (uint256, uint256, uint256, uint256, bool, bool)
        );
        
        return (collected >= GRADUATION_THRESHOLD, collected);
    }
    
    function graduateToken(address token) external onlyAuthorized {
        require(registry.isValidToken(token), "Invalid token");
        require(!graduationInfo[token].graduated, "Already graduated");
        
        (bool canGraduate, ) = this.checkGraduation(token);
        require(canGraduate, "Not ready for graduation");
        
        graduationInfo[token].graduated = true;
        graduationInfo[token].graduatedAt = block.timestamp;
        
        emit TokenGraduated(token, address(0), 0, 0);
    }
    
    function listOnDEX(address token) external payable nonReentrant returns (address poolAddress) {
        require(registry.isValidToken(token), "Invalid token");
        require(graduationInfo[token].graduated, "Not graduated");
        require(graduationInfo[token].poolAddress == address(0), "Already listed");
        
        uint256 sttAmount = msg.value > 0 ? msg.value : LOCKED_LIQUIDITY_STT;
        uint256 tokenAmount = LOCKED_LIQUIDITY_TOKENS;
        
        require(sttAmount >= LOCKED_LIQUIDITY_STT, "Insufficient STT");
        
        address wsttAddress = registry.getWSTT();
        require(wsttAddress != address(0), "WSTT not set");
        
        WSTT wstt = WSTT(payable(wsttAddress));
        wstt.deposit{value: sttAmount}();
        
        require(IERC20(token).balanceOf(address(this)) >= tokenAmount, "Insufficient tokens");
        
        IERC20(token).approve(QUICKSWAP_POSITION_MANAGER, tokenAmount);
        IERC20(wsttAddress).approve(QUICKSWAP_POSITION_MANAGER, sttAmount);
        
        INonfungiblePositionManager positionManager = INonfungiblePositionManager(QUICKSWAP_POSITION_MANAGER);
        
        address token0 = token < wsttAddress ? token : wsttAddress;
        address token1 = token < wsttAddress ? wsttAddress : token;
        
        uint160 sqrtPriceX96 = _calculateSqrtPriceX96(tokenAmount, sttAmount);
        
        poolAddress = positionManager.createAndInitializePoolIfNecessary(
            token0,
            token1,
            POOL_FEE,
            sqrtPriceX96
        );
        
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: POOL_FEE,
            tickLower: -887220,
            tickUpper: 887220,
            amount0Desired: token == token0 ? tokenAmount : sttAmount,
            amount1Desired: token == token0 ? sttAmount : tokenAmount,
            amount0Min: (token == token0 ? tokenAmount : sttAmount) * 95 / 100,
            amount1Min: (token == token0 ? sttAmount : tokenAmount) * 95 / 100,
            recipient: address(this),
            deadline: block.timestamp + 300
        });
        
        (uint256 tokenId, , , ) = positionManager.mint(params);
        
        graduationInfo[token].poolAddress = poolAddress;
        graduationInfo[token].lpTokenId = tokenId;
        graduationInfo[token].sttLocked = sttAmount;
        graduationInfo[token].tokensLocked = tokenAmount;
        
        emit LiquidityLocked(token, tokenId);
        
        return poolAddress;
    }
    
    function enablePublicTrading(address token) external onlyOwner {
        require(registry.isValidToken(token), "Invalid token");
        require(graduationInfo[token].graduated, "Not graduated");
        require(graduationInfo[token].poolAddress != address(0), "Not listed on DEX");
        require(!graduationInfo[token].publicTradingEnabled, "Already enabled");
        
        MemeToken memeToken = MemeToken(token);
        memeToken.enableTrading();
        
        graduationInfo[token].publicTradingEnabled = true;
        
        emit PublicTradingEnabled(token);
    }
    
    function forceGraduation(address token) external onlyOwner {
        require(registry.isValidToken(token), "Invalid token");
        require(!graduationInfo[token].graduated, "Already graduated");
        
        graduationInfo[token].graduated = true;
        graduationInfo[token].graduatedAt = block.timestamp;
        
        emit TokenGraduated(token, address(0), 0, 0);
    }
    
    function _calculateSqrtPriceX96(uint256 tokenAmount, uint256 sttAmount) internal pure returns (uint160) {
        uint256 price = (sttAmount * (2**96)) / tokenAmount;
        return uint160(_sqrt(price * (2**96)));
    }
    
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    function getGraduationInfo(address token) external view returns (GraduationInfo memory) {
        return graduationInfo[token];
    }
    
    function isGraduated(address token) external view returns (bool) {
        return graduationInfo[token].graduated;
    }
    
    function isPublicTradingEnabled(address token) external view returns (bool) {
        return graduationInfo[token].publicTradingEnabled;
    }
    
    function getPoolAddress(address token) external view returns (address) {
        return graduationInfo[token].poolAddress;
    }
    
    receive() external payable {}
}