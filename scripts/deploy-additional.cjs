const hre = require("hardhat");

async function main() {
  console.log("=== Additional Contracts Deployment ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "SOMI\n");

  const networkName = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  console.log("Network:", networkName);
  console.log("Chain ID:", chainId, "\n");

  // Determine if this is testnet based on chain ID
  const isTestnet = chainId === 50312n;
  console.log("Is Testnet:", isTestnet, "\n");

  
  const registryAddress = "0x3bb0d2796562a96Be23020EC750d8a1a021B9fDe"; 
  console.log("Using Registry at:", registryAddress, "\n");

  // Deploy SomnexIntegration
  console.log("Step 1/2: Deploying SomnexIntegration...");
  const SomnexIntegration = await hre.ethers.getContractFactory("SomnexIntegration");
  const somnexIntegration = await SomnexIntegration.deploy(registryAddress, isTestnet);
  await somnexIntegration.waitForDeployment();
  const somnexIntegrationAddress = await somnexIntegration.getAddress();
  console.log("✓ SomnexIntegration deployed to:", somnexIntegrationAddress, "\n");


  console.log("Step 2/2: Deploying MemeToken template (for testing)...");
  const MemeToken = await hre.ethers.getContractFactory("MemeToken");
  const memeToken = await MemeToken.deploy(
    "Trade.fun",           
    "TRF",                      
    "https://example.com/test.png", 
    "A test meme token for deployment testing", 
    deployer.address,            
    deployer.address             
  );
  await memeToken.waitForDeployment();
  const memeTokenAddress = await memeToken.getAddress();
  console.log("✓ MemeToken template deployed to:", memeTokenAddress, "\n");

  // Verification (if not localhost/hardhat)
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await somnexIntegration.deploymentTransaction().wait(5);
    console.log("✓ Confirmed\n");

    console.log("Verifying contracts on block explorer...");

    try {
      await hre.run("verify:verify", {
        address: somnexIntegrationAddress,
        constructorArguments: [registryAddress, isTestnet],
      });
      console.log("✓ SomnexIntegration verified");
    } catch (error) {
      console.log("✗ SomnexIntegration verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: memeTokenAddress,
        constructorArguments: [
          "Test Meme Token",
          "TEST",
          "https://example.com/test.png",
          "A test meme token for deployment testing",
          deployer.address,
          deployer.address
        ],
      });
      console.log("✓ MemeToken template verified");
    } catch (error) {
      console.log("✗ MemeToken template verification failed:", error.message);
    }
  }

  console.log("\n=== Additional Deployment Summary ===");
  console.log("Network:", networkName);
  console.log("Is Testnet:", isTestnet);
  console.log("Deployer:", deployer.address);
  console.log("Registry:", registryAddress);
  console.log("");
  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("SomnexIntegration:  ", somnexIntegrationAddress);
  console.log("MemeToken Template: ", memeTokenAddress);
  console.log("");
  console.log("Update the following in src/config/networks.ts:");
  console.log("-------------------");
  if (isTestnet) {
    console.log(`testnet: {`);
    console.log(`  // ... existing addresses ...`);
    console.log(`  SOMNEX_INTEGRATION: '${somnexIntegrationAddress}',`);
    console.log(`}`);
  } else {
    console.log(`mainnet: {`);
    console.log(`  // ... existing addresses ...`);
    console.log(`  SOMNEX_INTEGRATION: '${somnexIntegrationAddress}',`);
    console.log(`}`);
  }
  console.log("");
  console.log("Additional deployment completed successfully!");
  console.log("");
  console.log("Note: Remember to update the Registry address in this script");
  console.log("before running on your target network!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });