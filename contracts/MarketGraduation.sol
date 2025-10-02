// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/ISomnex.sol";
import "./MemeToken.sol";

contract MarketGraduation is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct GraduationInfo {
        bool graduated;
        bool publicTradingEnabled;
        uint256 graduatedAt;
        uint256 somiLocked;
        uint256 tokensLocked;
        address pairAddress;
        uint256 liquidityTokens;
    }

    IRegistry public registry;
    ISomnexFactory public somnexFactory;
    ISomnexRouter public somnexRouter;

    mapping(address => GraduationInfo) public graduationInfo;

    uint256 public constant GRADUATION_THRESHOLD = 10000 * 10**18;
    uint256 public constant LOCKED_LIQUIDITY_SOMI = 15000 * 10**18;
    uint256 public constant LOCKED_LIQUIDITY_TOKENS = 200_000_000 * 10**18;
    uint256 public constant TREASURY_FEE_PERCENT = 350;
    uint256 public constant GRADUATION_FEE = 200 * 10**18;
    uint256 public constant FEE_DENOMINATOR = 10000;

    address public constant SOMNEX_FACTORY = 0x46C6FBD364325aE500d1A5a3A7A32B34ec5c5e73;
    address public constant SOMNEX_ROUTER = 0x28783c7Af9bCF35cA9b5417077daBcB274D64537;
    address public constant WSOMI = 0x046EDe9564A72571df6F5e44d0405360c0f4dCab;

    address public treasuryAddress;
    
    event TokenGraduated(
        address indexed token,
        address indexed pair,
        uint256 somiLocked,
        uint256 tokensLocked
    );

    event PublicTradingEnabled(address indexed token);
    event LiquidityLocked(address indexed token, uint256 liquidityTokens);
    event TreasuryFeeSent(address indexed token, uint256 amount);
    event GraduationFeeSent(address indexed token, uint256 amount);
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner() ||
            msg.sender == registry.getBondingCurve(),
            "Not authorized"
        );
        _;
    }
    
    constructor(address _registry, address _treasury) Ownable(msg.sender) {
        registry = IRegistry(_registry);
        somnexFactory = ISomnexFactory(SOMNEX_FACTORY);
        somnexRouter = ISomnexRouter(SOMNEX_ROUTER);
        treasuryAddress = _treasury;
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
    
    function graduateToken(address token) external payable onlyAuthorized {
        require(registry.isValidToken(token), "Invalid token");
        require(!graduationInfo[token].graduated, "Already graduated");

        (bool canGraduate, ) = this.checkGraduation(token);
        require(canGraduate, "Not ready for graduation");

        graduationInfo[token].graduated = true;
        graduationInfo[token].graduatedAt = block.timestamp;

        uint256 somiAmount = address(this).balance;
        uint256 tokenAmount = LOCKED_LIQUIDITY_TOKENS;

        require(somiAmount >= LOCKED_LIQUIDITY_SOMI + GRADUATION_FEE, "Insufficient SOMI for listing");
        require(IERC20(token).balanceOf(address(this)) >= tokenAmount, "Insufficient tokens for listing");

        if (GRADUATION_FEE > 0 && treasuryAddress != address(0)) {
            payable(treasuryAddress).transfer(GRADUATION_FEE);
            emit GraduationFeeSent(token, GRADUATION_FEE);
            somiAmount -= GRADUATION_FEE;
        }

        uint256 totalSupply = IERC20(token).totalSupply();
        uint256 treasuryFeeAmount = (totalSupply * TREASURY_FEE_PERCENT) / FEE_DENOMINATOR;

        if (treasuryFeeAmount > 0 && treasuryAddress != address(0)) {
            IERC20(token).safeTransfer(treasuryAddress, treasuryFeeAmount);
            emit TreasuryFeeSent(token, treasuryFeeAmount);
        }

        address pairAddress = somnexFactory.getPair(token, WSOMI);
        if (pairAddress == address(0)) {
            pairAddress = somnexFactory.createPair(token, WSOMI);
        }

        IERC20(token).approve(address(somnexRouter), tokenAmount);

        (uint amountToken, uint amountSOMI, uint liquidity) = somnexRouter.addLiquidityETH{value: somiAmount}(
            token,
            tokenAmount,
            tokenAmount * 95 / 100,
            somiAmount * 95 / 100,
            address(this),
            block.timestamp + 300
        );

        graduationInfo[token].pairAddress = pairAddress;
        graduationInfo[token].liquidityTokens = liquidity;
        graduationInfo[token].somiLocked = amountSOMI;
        graduationInfo[token].tokensLocked = amountToken;

        emit TokenGraduated(token, pairAddress, amountSOMI, amountToken);
        emit LiquidityLocked(token, liquidity);
    }
    
    function listOnDEX(address token) external payable nonReentrant returns (address pairAddress) {
        require(registry.isValidToken(token), "Invalid token");
        require(graduationInfo[token].graduated, "Not graduated");
        require(graduationInfo[token].pairAddress != address(0), "Use graduateToken for first listing");

        return graduationInfo[token].pairAddress;
    }
    
    function enablePublicTrading(address token) external onlyOwner {
        require(registry.isValidToken(token), "Invalid token");
        require(graduationInfo[token].graduated, "Not graduated");
        require(graduationInfo[token].pairAddress != address(0), "Not listed on DEX");
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
    
    function setTreasuryAddress(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        treasuryAddress = _treasury;
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
    
    function getPairAddress(address token) external view returns (address) {
        return graduationInfo[token].pairAddress;
    }
    
    receive() external payable {}
}