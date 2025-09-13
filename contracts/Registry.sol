// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRegistry.sol";

contract Registry is IRegistry, Ownable {
    address public tokenFactory;
    address public bondingCurve;
    address public liquidityPool;
    address public userManager;
    address public feeManager;
    address public marketGraduation;
    address public wstt;
    
    mapping(address => bool) public validTokens;
    mapping(address => bool) public authorizedContracts;
    
    event ContractUpdated(string contractName, address newAddress);
    event TokenRegistered(address indexed token);
    
    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    function initialize(
        address _tokenFactory,
        address _bondingCurve,
        address _liquidityPool,
        address _userManager,
        address _feeManager,
        address _marketGraduation,
        address _wstt
    ) external onlyOwner {
        tokenFactory = _tokenFactory;
        bondingCurve = _bondingCurve;
        liquidityPool = _liquidityPool;
        userManager = _userManager;
        feeManager = _feeManager;
        marketGraduation = _marketGraduation;
        wstt = _wstt;
        
        authorizedContracts[_tokenFactory] = true;
        authorizedContracts[_bondingCurve] = true;
        authorizedContracts[_liquidityPool] = true;
        authorizedContracts[_userManager] = true;
        authorizedContracts[_feeManager] = true;
        authorizedContracts[_marketGraduation] = true;
    }
    
    function setAuthorizedContract(address _contract, bool _authorized) external onlyOwner {
        authorizedContracts[_contract] = _authorized;
    }
    
    function registerToken(address token) external onlyAuthorized {
        validTokens[token] = true;
        emit TokenRegistered(token);
    }
    
    function isValidToken(address token) external view returns (bool) {
        return validTokens[token];
    }
    
    function getTokenFactory() external view returns (address) {
        return tokenFactory;
    }
    
    function getBondingCurve() external view returns (address) {
        return bondingCurve;
    }
    
    function getLiquidityPool() external view returns (address) {
        return liquidityPool;
    }
    
    function getUserManager() external view returns (address) {
        return userManager;
    }
    
    function getFeeManager() external view returns (address) {
        return feeManager;
    }
    
    function getMarketGraduation() external view returns (address) {
        return marketGraduation;
    }
    
    function getWSTT() external view returns (address) {
        return wstt;
    }
}