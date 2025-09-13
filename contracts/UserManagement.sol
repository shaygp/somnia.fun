// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRegistry.sol";

contract UserManagement is Ownable {
    struct UserInfo {
        bool whitelisted;
        bool blacklisted;
        uint256 spamScore;
        uint256 transactionCount;
        uint256 firstSeenAt;
        uint256 lastActivityAt;
        uint256 tokenCreationLimit;
        uint256 tokensCreated;
    }
    
    IRegistry public registry;
    
    mapping(address => UserInfo) public users;
    mapping(address => address[]) public referrals;
    mapping(address => address) public referredBy;
    
    uint256 public constant DEFAULT_TOKEN_CREATION_LIMIT = 10;
    uint256 public constant SPAM_THRESHOLD = 5;
    uint256 public constant COOLDOWN_PERIOD = 1 hours;
    
    bool public whitelistEnabled = false;
    bool public spamProtectionEnabled = true;
    
    event UserAdded(address indexed user, address indexed referrer);
    event UserRemoved(address indexed user);
    event UserWhitelisted(address indexed user);
    event UserBlacklisted(address indexed user, string reason);
    event SpamFlagged(address indexed user, uint256 spamScore);
    event AccessGranted(address indexed user);
    event AccessDenied(address indexed user, string reason);
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || 
            msg.sender == registry.getTokenFactory() ||
            msg.sender == registry.getBondingCurve(),
            "Not authorized"
        );
        _;
    }
    
    constructor(address _registry) Ownable(msg.sender) {
        registry = IRegistry(_registry);
    }
    
    function addUser(address user) public returns (bool) {
        return addUserWithReferral(user, address(0));
    }
    
    function addUserWithReferral(address user, address referrer) public returns (bool) {
        require(user != address(0), "Invalid user address");
        require(user != referrer, "Cannot refer yourself");
        
        if (users[user].firstSeenAt == 0) {
            users[user] = UserInfo({
                whitelisted: !whitelistEnabled,
                blacklisted: false,
                spamScore: 0,
                transactionCount: 0,
                firstSeenAt: block.timestamp,
                lastActivityAt: block.timestamp,
                tokenCreationLimit: DEFAULT_TOKEN_CREATION_LIMIT,
                tokensCreated: 0
            });
            
            if (referrer != address(0) && users[referrer].firstSeenAt > 0) {
                referredBy[user] = referrer;
                referrals[referrer].push(user);
            }
            
            emit UserAdded(user, referrer);
        }
        
        return true;
    }
    
    function removeUser(address user) external onlyOwner {
        require(users[user].firstSeenAt > 0, "User not found");
        
        users[user].blacklisted = true;
        users[user].whitelisted = false;
        
        emit UserRemoved(user);
    }
    
    function checkAccess(address user) external view returns (bool) {
        if (users[user].blacklisted) {
            return false;
        }
        
        if (whitelistEnabled && !users[user].whitelisted) {
            return false;
        }
        
        if (spamProtectionEnabled && users[user].spamScore >= SPAM_THRESHOLD) {
            return false;
        }
        
        if (users[user].lastActivityAt > 0 && 
            block.timestamp - users[user].lastActivityAt < COOLDOWN_PERIOD) {
            return false;
        }
        
        return true;
    }
    
    function flagSpam(address user) external onlyAuthorized {
        require(users[user].firstSeenAt > 0, "User not found");
        
        users[user].spamScore++;
        
        if (users[user].spamScore >= SPAM_THRESHOLD) {
            users[user].blacklisted = true;
            emit UserBlacklisted(user, "Spam threshold exceeded");
        }
        
        emit SpamFlagged(user, users[user].spamScore);
    }
    
    function validateAccess(address user) external returns (bool) {
        if (users[user].firstSeenAt == 0) {
            addUser(user);
        }
        
        if (users[user].blacklisted) {
            emit AccessDenied(user, "User blacklisted");
            return false;
        }
        
        if (whitelistEnabled && !users[user].whitelisted) {
            emit AccessDenied(user, "Not whitelisted");
            return false;
        }
        
        if (spamProtectionEnabled && users[user].spamScore >= SPAM_THRESHOLD) {
            emit AccessDenied(user, "Spam score too high");
            return false;
        }
        
        users[user].transactionCount++;
        users[user].lastActivityAt = block.timestamp;
        
        emit AccessGranted(user);
        return true;
    }
    
    function whitelistUser(address user) external onlyOwner {
        require(users[user].firstSeenAt > 0, "User not found");
        require(!users[user].blacklisted, "User is blacklisted");
        
        users[user].whitelisted = true;
        emit UserWhitelisted(user);
    }
    
    function blacklistUser(address user, string memory reason) external onlyOwner {
        if (users[user].firstSeenAt == 0) {
            addUser(user);
        }
        
        users[user].blacklisted = true;
        users[user].whitelisted = false;
        
        emit UserBlacklisted(user, reason);
    }
    
    function setWhitelistEnabled(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
    }
    
    function setSpamProtectionEnabled(bool enabled) external onlyOwner {
        spamProtectionEnabled = enabled;
    }
    
    function setTokenCreationLimit(address user, uint256 limit) external onlyOwner {
        require(users[user].firstSeenAt > 0, "User not found");
        users[user].tokenCreationLimit = limit;
    }
    
    function incrementTokensCreated(address user) external onlyAuthorized {
        users[user].tokensCreated++;
    }
    
    function canCreateToken(address user) external view returns (bool) {
        if (!this.checkAccess(user)) {
            return false;
        }
        
        return users[user].tokensCreated < users[user].tokenCreationLimit;
    }
    
    function getUserInfo(address user) external view returns (UserInfo memory) {
        return users[user];
    }
    
    function getReferrals(address user) external view returns (address[] memory) {
        return referrals[user];
    }
    
    function getReferrer(address user) external view returns (address) {
        return referredBy[user];
    }
    
    function resetSpamScore(address user) external onlyOwner {
        require(users[user].firstSeenAt > 0, "User not found");
        users[user].spamScore = 0;
    }
}