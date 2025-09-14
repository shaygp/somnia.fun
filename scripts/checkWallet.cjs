const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const address = signers[0].address;
  const balance = await hre.ethers.provider.getBalance(address);

  console.log("Wallet Address:", address);
  console.log("Balance:", hre.ethers.formatEther(balance), "STT");
  console.log("Network:", hre.network.name);

  if (balance === 0n) {
    console.log("⚠️ Wallet has no funds. Please fund it using the testnet faucet:");
    console.log("   https://testnet.somnia.network/");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});