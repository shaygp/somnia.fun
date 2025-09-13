// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRegistry {
    function getTokenFactory() external view returns (address);
    function getBondingCurve() external view returns (address);
    function getLiquidityPool() external view returns (address);
    function getUserManager() external view returns (address);
    function getFeeManager() external view returns (address);
    function getMarketGraduation() external view returns (address);
    function getWSTT() external view returns (address);
    
    function isValidToken(address token) external view returns (bool);
    function registerToken(address token) external;
}