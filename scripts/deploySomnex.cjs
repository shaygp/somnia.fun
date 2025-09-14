const hre = require("hardhat");

async function main() {
  console.log("Deploying Somnex Integration...");

  const networkName = hre.network.name;
  const isTestnet = networkName.includes("testnet") || networkName.includes("devnet") || networkName === "localhost";

  console.log(`Deploying to ${networkName} (${isTestnet ? 'Testnet' : 'Mainnet'})`);

  const registryAddress = isTestnet
    ? "0x0becC48729c02fC5d30239ab4E1B8c9AbB0d1f78"
    : "0x0becC48729c02fC5d30239ab4E1B8c9AbB0d1f78";

  const SomnexIntegration = await hre.ethers.getContractFactory("SomnexIntegration");
  const somnexIntegration = await SomnexIntegration.deploy(registryAddress, isTestnet);

  await somnexIntegration.waitForDeployment();

  console.log("SomnexIntegration deployed to:", await somnexIntegration.getAddress());
  console.log("Network:", networkName);
  console.log("Is Testnet:", isTestnet);

  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await somnexIntegration.deployTransaction.wait(5);

    const contractAddress = await somnexIntegration.getAddress();
    console.log("Verifying contract on explorer...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [registryAddress, isTestnet],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  const contractAddress = await somnexIntegration.getAddress();

  console.log("\n=== Deployment Summary ===");
  console.log("SomnexIntegration:", contractAddress);
  console.log("Registry:", registryAddress);
  console.log("Network:", networkName);
  console.log("");
  console.log("Update the following in src/config/networks.ts:");
  console.log(`SOMNEX_INTEGRATION: '${contractAddress}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });