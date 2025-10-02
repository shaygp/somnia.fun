const hre = require("hardhat");

async function main() {
  console.log("=== Somnia.fun Deployment Script ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "SOMI\n");

  const networkName = hre.network.name;
  console.log("Network:", networkName);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId, "\n");

  const treasuryAddress = deployer.address;
  console.log("Treasury Address:", treasuryAddress, "\n");

  console.log("Step 1/6: Deploying Registry...");
  const Registry = await hre.ethers.getContractFactory("Registry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✓ Registry deployed to:", registryAddress, "\n");

  console.log("Step 2/6: Deploying TokenFactory...");
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy(registryAddress, treasuryAddress);
  await tokenFactory.waitForDeployment();
  const tokenFactoryAddress = await tokenFactory.getAddress();
  console.log("✓ TokenFactory deployed to:", tokenFactoryAddress, "\n");

  console.log("Step 3/6: Deploying BondingCurveContract...");
  const BondingCurveContract = await hre.ethers.getContractFactory("BondingCurveContract");
  const bondingCurve = await BondingCurveContract.deploy(registryAddress);
  await bondingCurve.waitForDeployment();
  const bondingCurveAddress = await bondingCurve.getAddress();
  console.log("✓ BondingCurveContract deployed to:", bondingCurveAddress, "\n");

  console.log("Step 4/6: Deploying MarketGraduation...");
  const MarketGraduation = await hre.ethers.getContractFactory("MarketGraduation");
  const marketGraduation = await MarketGraduation.deploy(registryAddress, treasuryAddress);
  await marketGraduation.waitForDeployment();
  const marketGraduationAddress = await marketGraduation.getAddress();
  console.log("✓ MarketGraduation deployed to:", marketGraduationAddress, "\n");

  console.log("Step 5/6: Deploying FeeManager...");
  const FeeManager = await hre.ethers.getContractFactory("FeeManager");
  const feeManager = await FeeManager.deploy(registryAddress, treasuryAddress);
  await feeManager.waitForDeployment();
  const feeManagerAddress = await feeManager.getAddress();
  console.log("✓ FeeManager deployed to:", feeManagerAddress, "\n");

  console.log("Step 6/6: Configuring Registry...");
  await registry.initialize(
    tokenFactoryAddress,
    bondingCurveAddress,
    "0x0000000000000000000000000000000000000000", // liquidityPool placeholder
    "0x0000000000000000000000000000000000000000", // userManager placeholder  
    feeManagerAddress,
    marketGraduationAddress,
    "0x0000000000000000000000000000000000000000"  // wstt placeholder
  );
  console.log("✓ Registry initialized with contract addresses\n");

  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await registry.deploymentTransaction().wait(5);
    console.log("✓ Confirmed\n");

    console.log("Verifying contracts on block explorer...");

    try {
      await hre.run("verify:verify", {
        address: registryAddress,
        constructorArguments: [],
      });
      console.log("✓ Registry verified");
    } catch (error) {
      console.log("✗ Registry verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: tokenFactoryAddress,
        constructorArguments: [registryAddress, treasuryAddress],
      });
      console.log("✓ TokenFactory verified");
    } catch (error) {
      console.log("✗ TokenFactory verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: bondingCurveAddress,
        constructorArguments: [registryAddress],
      });
      console.log("✓ BondingCurveContract verified");
    } catch (error) {
      console.log("✗ BondingCurveContract verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: marketGraduationAddress,
        constructorArguments: [registryAddress, treasuryAddress],
      });
      console.log("✓ MarketGraduation verified");
    } catch (error) {
      console.log("✗ MarketGraduation verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: feeManagerAddress,
        constructorArguments: [registryAddress, treasuryAddress],
      });
      console.log("✓ FeeManager verified");
    } catch (error) {
      console.log("✗ FeeManager verification failed:", error.message);
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", networkName);
  console.log("Deployer:", deployer.address);
  console.log("Treasury:", treasuryAddress);
  console.log("");
  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("Registry:           ", registryAddress);
  console.log("TokenFactory:       ", tokenFactoryAddress);
  console.log("BondingCurve:       ", bondingCurveAddress);
  console.log("MarketGraduation:   ", marketGraduationAddress);
  console.log("FeeManager:         ", feeManagerAddress);
  console.log("");
  console.log("Update the following in src/config/networks.ts:");
  console.log("-------------------");
  console.log(`mainnet: {`);
  console.log(`  REGISTRY: '${registryAddress}',`);
  console.log(`  TOKEN_FACTORY: '${tokenFactoryAddress}',`);
  console.log(`  BONDING_CURVE: '${bondingCurveAddress}',`);
  console.log(`  MARKET_GRADUATION: '${marketGraduationAddress}',`);
  console.log(`  FEE_MANAGER: '${feeManagerAddress}',`);
  console.log(`  WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',`);
  console.log(`  SOMNEX_FACTORY: '0x46C6FBD364325aE500d1A5a3A7A32B34ec5c5e73',`);
  console.log(`  SOMNEX_ROUTER: '0x28783c7Af9bCF35cA9b5417077daBcB274D64537',`);
  console.log(`}`);
  console.log("");
  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
