// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/ISomnex.sol";
import "./MemeToken.sol";

contract SomnexIntegration is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct SomnexGraduationInfo {
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

    mapping(address => SomnexGraduationInfo) public graduationInfo;

    uint256 public constant GRADUATION_THRESHOLD = 10000 * 10**18;
    uint256 public constant LOCKED_LIQUIDITY_SOMI = 15000 * 10**18;
    uint256 public constant LOCKED_LIQUIDITY_TOKENS = 200_000_000 * 10**18;
    uint256 public constant PERMANENT_LOCK_DURATION = 365 days * 100;

    address public somnexFactoryMainnet = 0x46C6FBD364325aE500d1A5a3A7A32B34ec5c5e73;
    address public somnexRouterMainnet = 0x28783c7Af9bCF35cA9b5417077daBcB274D64537;

    address public somnexFactoryTestnet = 0x46C6FBD364325aE500d1A5a3A7A32B34ec5c5e73;
    address public somnexRouterTestnet = 0x28783c7Af9bCF35cA9b5417077daBcB274D64537;

    address public constant WSOMI = 0x046EDe9564A72571df6F5e44d0405360c0f4dCab;

    bool public isTestnet;

    event TokenGraduatedToSomnex(
        address indexed token,
        address indexed pair,
        uint256 somiLocked,
        uint256 tokensLocked,
        uint256 liquidityTokens
    );

    event PublicTradingEnabledOnSomnex(address indexed token);
    event LiquidityLockedOnSomnex(address indexed token, uint256 liquidityTokens);

    modifier onlyAuthorized() {
        require(
            msg.sender == owner() ||
            msg.sender == registry.getBondingCurve(),
            "Not authorized"
        );
        _;
    }

    constructor(address _registry, bool _isTestnet) Ownable(msg.sender) {
        registry = IRegistry(_registry);
        isTestnet = _isTestnet;

        if (_isTestnet) {
            somnexFactory = ISomnexFactory(somnexFactoryTestnet);
            somnexRouter = ISomnexRouter(somnexRouterTestnet);
        } else {
            somnexFactory = ISomnexFactory(somnexFactoryMainnet);
            somnexRouter = ISomnexRouter(somnexRouterMainnet);
        }
    }

    function setNetworkConfig(bool _isTestnet) external onlyOwner {
        isTestnet = _isTestnet;

        if (_isTestnet) {
            somnexFactory = ISomnexFactory(somnexFactoryTestnet);
            somnexRouter = ISomnexRouter(somnexRouterTestnet);
        } else {
            somnexFactory = ISomnexFactory(somnexFactoryMainnet);
            somnexRouter = ISomnexRouter(somnexRouterMainnet);
        }
    }

    function setSomnexAddresses(
        address _factoryMainnet,
        address _routerMainnet,
        address _factoryTestnet,
        address _routerTestnet
    ) external onlyOwner {
        somnexFactoryMainnet = _factoryMainnet;
        somnexRouterMainnet = _routerMainnet;
        somnexFactoryTestnet = _factoryTestnet;
        somnexRouterTestnet = _routerTestnet;

        if (isTestnet) {
            somnexFactory = ISomnexFactory(somnexFactoryTestnet);
            somnexRouter = ISomnexRouter(somnexRouterTestnet);
        } else {
            somnexFactory = ISomnexFactory(somnexFactoryMainnet);
            somnexRouter = ISomnexRouter(somnexRouterMainnet);
        }
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

    function graduateTokenToSomnex(address token) external payable onlyAuthorized {
        require(registry.isValidToken(token), "Invalid token");
        require(!graduationInfo[token].graduated, "Already graduated");

        (bool canGraduate, ) = this.checkGraduation(token);
        require(canGraduate, "Not ready for graduation");

        graduationInfo[token].graduated = true;
        graduationInfo[token].graduatedAt = block.timestamp;

        emit TokenGraduatedToSomnex(token, address(0), 0, 0, 0);
    }

    function listOnSomnexDEX(address token) external payable nonReentrant returns (address pairAddress) {
        require(registry.isValidToken(token), "Invalid token");
        require(graduationInfo[token].graduated, "Not graduated");
        require(graduationInfo[token].pairAddress == address(0), "Already listed");

        uint256 somiAmount = address(this).balance;
        uint256 tokenAmount = LOCKED_LIQUIDITY_TOKENS;

        require(somiAmount >= LOCKED_LIQUIDITY_SOMI, "Insufficient SOMI");
        require(IERC20(token).balanceOf(address(this)) >= tokenAmount, "Insufficient tokens");

        pairAddress = somnexFactory.getPair(token, WSOMI);
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

        emit LiquidityLockedOnSomnex(token, liquidity);

        return pairAddress;
    }

    function enablePublicTradingOnSomnex(address token) external onlyOwner {
        require(registry.isValidToken(token), "Invalid token");
        require(graduationInfo[token].graduated, "Not graduated");
        require(graduationInfo[token].pairAddress != address(0), "Not listed on Somnex");
        require(!graduationInfo[token].publicTradingEnabled, "Already enabled");

        MemeToken memeToken = MemeToken(token);
        memeToken.enableTrading();

        graduationInfo[token].publicTradingEnabled = true;

        emit PublicTradingEnabledOnSomnex(token);
    }

    function getTokenPrice(address token) external view returns (uint256 priceInSOMI) {
        address pairAddress = graduationInfo[token].pairAddress;
        if (pairAddress == address(0)) {
            return 0;
        }

        ISomnexPair pair = ISomnexPair(pairAddress);
        (uint112 reserve0, uint112 reserve1, ) = pair.getReserves();

        address token0 = pair.token0();

        if (token0 == token) {
            priceInSOMI = (uint256(reserve1) * 10**18) / uint256(reserve0);
        } else {
            priceInSOMI = (uint256(reserve0) * 10**18) / uint256(reserve1);
        }

        return priceInSOMI;
    }

    function getQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = somnexRouter.getAmountsOut(amountIn, path);
        return amounts[1];
    }

    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient
    ) external nonReentrant returns (uint256[] memory amounts) {
        require(amountIn > 0, "Invalid amount");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(address(somnexRouter), amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        amounts = somnexRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            recipient,
            block.timestamp + 300
        );

        return amounts;
    }

    function swapSOMIForTokens(
        address tokenOut,
        uint256 amountOutMin,
        address recipient
    ) external payable nonReentrant returns (uint256[] memory amounts) {
        require(msg.value > 0, "Invalid SOMI amount");

        address[] memory path = new address[](2);
        path[0] = WSOMI;
        path[1] = tokenOut;

        amounts = somnexRouter.swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            recipient,
            block.timestamp + 300
        );

        return amounts;
    }

    function swapTokensForSOMI(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient
    ) external nonReentrant returns (uint256[] memory amounts) {
        require(amountIn > 0, "Invalid amount");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(address(somnexRouter), amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = WSOMI;

        amounts = somnexRouter.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            recipient,
            block.timestamp + 300
        );

        return amounts;
    }

    function forceGraduation(address token) external onlyOwner {
        require(registry.isValidToken(token), "Invalid token");
        require(!graduationInfo[token].graduated, "Already graduated");

        graduationInfo[token].graduated = true;
        graduationInfo[token].graduatedAt = block.timestamp;

        emit TokenGraduatedToSomnex(token, address(0), 0, 0, 0);
    }

    function getGraduationInfo(address token) external view returns (SomnexGraduationInfo memory) {
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