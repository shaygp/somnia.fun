// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRegistry.sol";

contract LiquidityPoolContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLPTokens;
        bool active;
    }
    
    struct LPPosition {
        uint256 lpTokens;
        uint256 tokenADeposited;
        uint256 tokenBDeposited;
    }
    
    IRegistry public registry;
    
    mapping(bytes32 => Pool) public pools;
    mapping(bytes32 => mapping(address => LPPosition)) public positions;
    mapping(address => bytes32[]) public userPools;
    
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public constant FEE_PERCENT = 30;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    event LiquidityAdded(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 lpTokens
    );
    
    event LiquidityRemoved(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 lpTokens
    );
    
    event Swapped(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _registry) Ownable(msg.sender) {
        registry = IRegistry(_registry);
    }
    
    function getPoolId(address tokenA, address tokenB) public pure returns (bytes32) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return keccak256(abi.encodePacked(token0, token1));
    }
    
    function createPool(address tokenA, address tokenB) external {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Invalid token");
        
        bytes32 poolId = getPoolId(tokenA, tokenB);
        require(!pools[poolId].active, "Pool exists");
        
        pools[poolId] = Pool({
            tokenA: tokenA < tokenB ? tokenA : tokenB,
            tokenB: tokenA < tokenB ? tokenB : tokenA,
            reserveA: 0,
            reserveB: 0,
            totalLPTokens: 0,
            active: true
        });
    }
    
    function addLiquidity(
        address user,
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (uint256 lpTokens) {
        require(amountA > 0 && amountB > 0, "Invalid amounts");
        
        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        require(pool.active, "Pool not active");
        
        bool isFirstDeposit = (pool.reserveA == 0 && pool.reserveB == 0);
        
        if (!isFirstDeposit) {
            uint256 requiredB = (amountA * pool.reserveB) / pool.reserveA;
            require(amountB >= requiredB, "Insufficient tokenB amount");
            
            if (amountB > requiredB) {
                amountB = requiredB;
            }
        }
        
        IERC20(tokenA).safeTransferFrom(user, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(user, address(this), amountB);
        
        if (isFirstDeposit) {
            lpTokens = _sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            pool.totalLPTokens = lpTokens + MINIMUM_LIQUIDITY;
        } else {
            uint256 lpFromA = (amountA * pool.totalLPTokens) / pool.reserveA;
            uint256 lpFromB = (amountB * pool.totalLPTokens) / pool.reserveB;
            lpTokens = lpFromA < lpFromB ? lpFromA : lpFromB;
            pool.totalLPTokens += lpTokens;
        }
        
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        
        positions[poolId][user].lpTokens += lpTokens;
        positions[poolId][user].tokenADeposited += amountA;
        positions[poolId][user].tokenBDeposited += amountB;
        
        if (_isNewPool(user, poolId)) {
            userPools[user].push(poolId);
        }
        
        emit LiquidityAdded(user, tokenA, tokenB, amountA, amountB, lpTokens);
        
        return lpTokens;
    }
    
    function removeLiquidity(
        address user,
        uint256 lpTokens,
        address tokenA,
        address tokenB
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(lpTokens > 0, "Invalid LP amount");
        
        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        require(pool.active, "Pool not active");
        
        LPPosition storage position = positions[poolId][user];
        require(position.lpTokens >= lpTokens, "Insufficient LP tokens");
        
        amountA = (lpTokens * pool.reserveA) / pool.totalLPTokens;
        amountB = (lpTokens * pool.reserveB) / pool.totalLPTokens;
        
        position.lpTokens -= lpTokens;
        pool.totalLPTokens -= lpTokens;
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        
        IERC20(pool.tokenA).safeTransfer(user, amountA);
        IERC20(pool.tokenB).safeTransfer(user, amountB);
        
        emit LiquidityRemoved(user, tokenA, tokenB, amountA, amountB, lpTokens);
        
        return (amountA, amountB);
    }
    
    function swap(
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid amount");
        require(tokenIn != tokenOut, "Same token");
        
        bytes32 poolId = getPoolId(tokenIn, tokenOut);
        Pool storage pool = pools[poolId];
        require(pool.active, "Pool not active");
        
        bool isTokenA = (tokenIn == pool.tokenA);
        uint256 reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenA ? pool.reserveB : pool.reserveA;
        
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_PERCENT);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
        
        require(amountOut > 0, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");
        
        IERC20(tokenIn).safeTransferFrom(user, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(user, amountOut);
        
        if (isTokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }
        
        address feeManager = registry.getFeeManager();
        if (feeManager != address(0)) {
            uint256 feeAmount = (amountIn * FEE_PERCENT) / FEE_DENOMINATOR;
            IERC20(tokenIn).safeTransfer(feeManager, feeAmount);
        }
        
        emit Swapped(user, tokenIn, tokenOut, amountIn, amountOut);
        
        return amountOut;
    }
    
    function getPoolInfo(address tokenA, address tokenB) external view returns (Pool memory) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        return pools[poolId];
    }
    
    function getUserPosition(address user, address tokenA, address tokenB) external view returns (LPPosition memory) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        return positions[poolId][user];
    }
    
    function getUserPools(address user) external view returns (bytes32[] memory) {
        return userPools[user];
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
    
    function _isNewPool(address user, bytes32 poolId) internal view returns (bool) {
        bytes32[] memory userPoolIds = userPools[user];
        for (uint256 i = 0; i < userPoolIds.length; i++) {
            if (userPoolIds[i] == poolId) return false;
        }
        return true;
    }
}