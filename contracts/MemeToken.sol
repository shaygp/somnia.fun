// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MemeToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    string private _tokenImageUri;
    string private _description;
    address public immutable launchpad;
    address public immutable factory;
    bool public tradingEnabled;
    
    mapping(address => bool) public authorizedMinters;

    modifier onlyLaunchpad() {
        require(msg.sender == launchpad, "Only launchpad can call");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == launchpad || 
            msg.sender == factory || 
            msg.sender == owner() ||
            authorizedMinters[msg.sender],
            "Not authorized"
        );
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        string memory imageUri,
        string memory desc,
        address creator,
        address _launchpad
    ) ERC20(name, symbol) Ownable(creator) {
        _tokenImageUri = imageUri;
        _description = desc;
        launchpad = _launchpad;
        factory = msg.sender;
        _mint(_launchpad, TOTAL_SUPPLY);
    }

    function enableTrading() external onlyAuthorized {
        tradingEnabled = true;
    }
    
    function mint(address to, uint256 amount) external onlyAuthorized {
        _mint(to, amount);
    }
    
    function burnFrom(address account, uint256 amount) public override {
        if (msg.sender != factory && msg.sender != owner()) {
            uint256 currentAllowance = allowance(account, msg.sender);
            require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
            _approve(account, msg.sender, currentAllowance - amount);
        }
        _burn(account, amount);
    }
    
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0) && from != launchpad && to != launchpad) {
            require(tradingEnabled, "Trading not enabled");
        }
        super._update(from, to, value);
    }

    function tokenImageUri() external view returns (string memory) {
        return _tokenImageUri;
    }

    function description() external view returns (string memory) {
        return _description;
    }
    
    function updateMetadata(string memory imageUri, string memory desc) external onlyOwner {
        _tokenImageUri = imageUri;
        _description = desc;
    }
}