// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRegistry.sol";

contract FeeManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct FeeDistribution {
        uint256 platformFee;
        uint256 creatorFee;
        uint256 stakersFee;
        uint256 liquidityProvidersFee;
        uint256 referrerFee;
    }
    
    struct TokenFees {
        uint256 totalCollected;
        uint256 creatorClaimed;
        uint256 platformClaimed;
        mapping(address => uint256) stakerRewards;
        mapping(address => uint256) lpRewards;
        mapping(address => uint256) referrerRewards;
    }
    
    IRegistry public registry;
    
    mapping(address => TokenFees) public tokenFees;
    mapping(address => uint256) public userTotalRewards;
    mapping(address => uint256) public userClaimedRewards;
    
    uint256 public constant PLATFORM_FEE_PERCENT = 200;
    uint256 public constant CREATOR_FEE_PERCENT = 100;
    uint256 public constant STAKERS_FEE_PERCENT = 100;
    uint256 public constant LP_FEE_PERCENT = 50;
    uint256 public constant REFERRER_FEE_PERCENT = 50;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    uint256 public totalPlatformFees;
    uint256 public totalCreatorFees;
    uint256 public totalStakersFees;
    uint256 public totalLPFees;
    uint256 public totalReferrerFees;
    
    address public treasuryAddress;
    
    event FeeCollected(
        address indexed token,
        address indexed from,
        uint256 amount,
        string transactionType
    );
    
    event RewardsDistributed(
        address indexed token,
        address indexed creator,
        uint256 creatorAmount,
        uint256 stakersAmount,
        uint256 lpAmount
    );
    
    event RewardsClaimed(
        address indexed user,
        uint256 amount
    );
    
    event TreasuryUpdated(address indexed newTreasury);
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner() ||
            msg.sender == registry.getTokenFactory() ||
            msg.sender == registry.getBondingCurve() ||
            msg.sender == registry.getLiquidityPool() ||
            msg.sender == registry.getMarketGraduation(),
            "Not authorized"
        );
        _;
    }
    
    constructor(address _registry, address _treasury) Ownable(msg.sender) {
        registry = IRegistry(_registry);
        treasuryAddress = _treasury;
    }
    
    function collectFee(
        address token,
        address from,
        uint256 amount,
        string memory transactionType
    ) external payable onlyAuthorized {
        require(amount > 0 || msg.value > 0, "No fee to collect");
        
        uint256 feeAmount = msg.value > 0 ? msg.value : amount;
        
        TokenFees storage fees = tokenFees[token];
        fees.totalCollected += feeAmount;
        
        FeeDistribution memory distribution = calculateFeeDistribution(feeAmount);
        
        totalPlatformFees += distribution.platformFee;
        totalCreatorFees += distribution.creatorFee;
        totalStakersFees += distribution.stakersFee;
        totalLPFees += distribution.liquidityProvidersFee;
        totalReferrerFees += distribution.referrerFee;
        
        emit FeeCollected(token, from, feeAmount, transactionType);
    }
    
    function distributeRewards(
        address token,
        address tokenCreator,
        address[] memory stakers,
        address[] memory liquidityProviders
    ) external onlyOwner {
        TokenFees storage fees = tokenFees[token];
        require(fees.totalCollected > 0, "No fees to distribute");
        
        FeeDistribution memory distribution = calculateFeeDistribution(fees.totalCollected);
        
        if (tokenCreator != address(0) && distribution.creatorFee > 0) {
            userTotalRewards[tokenCreator] += distribution.creatorFee;
            fees.creatorClaimed += distribution.creatorFee;
        }
        
        if (stakers.length > 0 && distribution.stakersFee > 0) {
            uint256 rewardPerStaker = distribution.stakersFee / stakers.length;
            for (uint256 i = 0; i < stakers.length; i++) {
                fees.stakerRewards[stakers[i]] += rewardPerStaker;
                userTotalRewards[stakers[i]] += rewardPerStaker;
            }
        }
        
        if (liquidityProviders.length > 0 && distribution.liquidityProvidersFee > 0) {
            uint256 rewardPerLP = distribution.liquidityProvidersFee / liquidityProviders.length;
            for (uint256 i = 0; i < liquidityProviders.length; i++) {
                fees.lpRewards[liquidityProviders[i]] += rewardPerLP;
                userTotalRewards[liquidityProviders[i]] += rewardPerLP;
            }
        }
        
        if (treasuryAddress != address(0) && distribution.platformFee > 0) {
            userTotalRewards[treasuryAddress] += distribution.platformFee;
            fees.platformClaimed += distribution.platformFee;
        }
        
        emit RewardsDistributed(
            token,
            tokenCreator,
            distribution.creatorFee,
            distribution.stakersFee,
            distribution.liquidityProvidersFee
        );
    }
    
    function claimRewards() external nonReentrant {
        uint256 pendingRewards = userTotalRewards[msg.sender] - userClaimedRewards[msg.sender];
        require(pendingRewards > 0, "No rewards to claim");
        require(address(this).balance >= pendingRewards, "Insufficient contract balance");
        
        userClaimedRewards[msg.sender] += pendingRewards;
        
        payable(msg.sender).transfer(pendingRewards);
        
        emit RewardsClaimed(msg.sender, pendingRewards);
    }
    
    function distributeReferrerReward(address referrer, uint256 amount) external onlyAuthorized {
        require(referrer != address(0), "Invalid referrer");
        require(amount > 0, "Invalid amount");
        
        userTotalRewards[referrer] += amount;
        totalReferrerFees += amount;
    }
    
    function calculateFeeDistribution(uint256 amount) public pure returns (FeeDistribution memory) {
        return FeeDistribution({
            platformFee: (amount * PLATFORM_FEE_PERCENT) / FEE_DENOMINATOR,
            creatorFee: (amount * CREATOR_FEE_PERCENT) / FEE_DENOMINATOR,
            stakersFee: (amount * STAKERS_FEE_PERCENT) / FEE_DENOMINATOR,
            liquidityProvidersFee: (amount * LP_FEE_PERCENT) / FEE_DENOMINATOR,
            referrerFee: (amount * REFERRER_FEE_PERCENT) / FEE_DENOMINATOR
        });
    }
    
    function setTreasuryAddress(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        treasuryAddress = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    function withdrawPlatformFees() external onlyOwner {
        require(totalPlatformFees > 0, "No platform fees to withdraw");
        require(treasuryAddress != address(0), "Treasury not set");
        
        uint256 amount = totalPlatformFees;
        totalPlatformFees = 0;
        
        payable(treasuryAddress).transfer(amount);
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    function getPendingRewards(address user) external view returns (uint256) {
        return userTotalRewards[user] - userClaimedRewards[user];
    }
    
    function getTokenFeeInfo(address token) external view returns (
        uint256 totalCollected,
        uint256 creatorClaimed,
        uint256 platformClaimed
    ) {
        TokenFees storage fees = tokenFees[token];
        return (fees.totalCollected, fees.creatorClaimed, fees.platformClaimed);
    }
    
    function getUserRewardInfo(address user, address token) external view returns (
        uint256 stakerRewards,
        uint256 lpRewards,
        uint256 referrerRewards
    ) {
        TokenFees storage fees = tokenFees[token];
        return (
            fees.stakerRewards[user],
            fees.lpRewards[user],
            fees.referrerRewards[user]
        );
    }
    
    receive() external payable {}
}