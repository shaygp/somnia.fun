const hre = require("hardhat");

async function main() {
  console.log("Deploying Somnex Integration...");

  const networkName = hre.network.name;
  const isTestnet = networkName.includes("testnet") || networkName === "localhost";

  console.log(`Deploying to ${networkName} (${isTestnet ? 'Testnet' : 'Mainnet'})`);

  const registryAddress = isTestnet
    ? "0x0becC48729c02fC5d30239ab4E1B8c9AbB0d1f78"
    : "0x0becC48729c02fC5d30239ab4E1B8c9AbB0d1f78";

  const SomnexIntegration = await hre.ethers.getContractFactory("SomnexIntegration");
  const somnexIntegration = await SomnexIntegration.deploy(registryAddress, isTestnet);

  await somnexIntegration.deployed();

  console.log("SomnexIntegration deployed to:", somnexIntegration.address);
  console.log("Network:", networkName);
  console.log("Is Testnet:", isTestnet);

  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await somnexIntegration.deployTransaction.wait(5);

    console.log("Verifying contract on explorer...");
    try {
      await hre.run("verify:verify", {
        address: somnexIntegration.address,
        constructorArguments: [registryAddress, isTestnet],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log("SomnexIntegration:", somnexIntegration.address);
  console.log("Registry:", registryAddress);
  console.log("Network:", networkName);
  console.log("");
  console.log("Update the following in src/config/networks.ts:");
  console.log(`SOMNEX_INTEGRATION: '${somnexIntegration.address}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });