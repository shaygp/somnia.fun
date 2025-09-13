// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MemeToken.sol";
import "./interfaces/IRegistry.sol";

contract TokenFactory is Ownable, ReentrancyGuard {
    struct TokenMetadata {
        string name;
        string symbol;
        string imageUri;
        string description;
        address creator;
        uint256 createdAt;
        uint256 totalSupply;
        bool active;
    }
    
    IRegistry public registry;
    
    mapping(address => TokenMetadata) public tokenMetadata;
    address[] public allTokens;
    mapping(address => address[]) public creatorTokens;
    
    uint256 public constant CREATION_FEE = 0.001 ether;
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;
    
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply
    );
    
    event MetadataUpdated(address indexed tokenAddress, string imageUri, string description);
    event TokenBurned(address indexed tokenAddress, uint256 amount);
    event TokenMinted(address indexed tokenAddress, uint256 amount);
    
    modifier onlyTokenCreator(address tokenAddress) {
        require(tokenMetadata[tokenAddress].creator == msg.sender, "Not token creator");
        _;
    }
    
    constructor(address _registry) Ownable(msg.sender) {
        registry = IRegistry(_registry);
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        uint256 supply,
        string memory imageUri,
        string memory description
    ) external payable nonReentrant returns (address) {
        require(msg.value >= CREATION_FEE, "Insufficient creation fee");
        require(bytes(name).length > 0 && bytes(symbol).length > 0, "Invalid name or symbol");
        require(supply > 0, "Supply must be greater than 0");
        
        address bondingCurve = registry.getBondingCurve();
        require(bondingCurve != address(0), "Bonding curve not set");
        
        MemeToken newToken = new MemeToken(
            name,
            symbol,
            imageUri,
            description,
            msg.sender,
            bondingCurve
        );
        
        address tokenAddress = address(newToken);
        
        tokenMetadata[tokenAddress] = TokenMetadata({
            name: name,
            symbol: symbol,
            imageUri: imageUri,
            description: description,
            creator: msg.sender,
            createdAt: block.timestamp,
            totalSupply: supply,
            active: true
        });
        
        allTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        
        registry.registerToken(tokenAddress);
        
        address feeManager = registry.getFeeManager();
        if (feeManager != address(0) && msg.value > 0) {
            (bool success, ) = feeManager.call{value: msg.value}("");
            require(success, "Fee transfer failed");
        }
        
        emit TokenCreated(tokenAddress, msg.sender, name, symbol, supply);
        
        return tokenAddress;
    }
    
    function setMetadata(
        address tokenAddress,
        string memory imageUri,
        string memory description
    ) external onlyTokenCreator(tokenAddress) {
        require(tokenMetadata[tokenAddress].active, "Token not active");
        
        TokenMetadata storage metadata = tokenMetadata[tokenAddress];
        metadata.imageUri = imageUri;
        metadata.description = description;
        
        emit MetadataUpdated(tokenAddress, imageUri, description);
    }
    
    function burnToken(address tokenAddress, uint256 amount) external {
        require(tokenMetadata[tokenAddress].active, "Token not active");
        require(amount > 0, "Amount must be greater than 0");
        
        MemeToken token = MemeToken(tokenAddress);
        require(token.balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        token.burnFrom(msg.sender, amount);
        
        tokenMetadata[tokenAddress].totalSupply -= amount;
        
        emit TokenBurned(tokenAddress, amount);
    }
    
    function mintToken(address tokenAddress, uint256 amount) external onlyTokenCreator(tokenAddress) {
        require(tokenMetadata[tokenAddress].active, "Token not active");
        require(amount > 0, "Amount must be greater than 0");
        
        MemeToken token = MemeToken(tokenAddress);
        token.mint(msg.sender, amount);
        
        tokenMetadata[tokenAddress].totalSupply += amount;
        
        emit TokenMinted(tokenAddress, amount);
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
    
    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }
    
    function getTokenMetadata(address tokenAddress) external view returns (TokenMetadata memory) {
        return tokenMetadata[tokenAddress];
    }
}