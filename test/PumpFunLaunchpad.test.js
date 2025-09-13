const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PumpFunLaunchpad", function () {
    let launchpad, owner, creator, buyer, seller, feeRecipient;
    let tokenAddress;

    beforeEach(async function () {
        [owner, creator, buyer, seller, feeRecipient] = await ethers.getSigners();
        
        const PumpFunLaunchpad = await ethers.getContractFactory("PumpFunLaunchpad");
        launchpad = await PumpFunLaunchpad.deploy(feeRecipient.address);
        await launchpad.waitForDeployment();
    });

    describe("Token Creation", function () {
        it("Should create a new meme token", async function () {
            const creationFee = ethers.parseEther("0.1");
            
            await expect(
                launchpad.connect(creator).createToken(
                    "TestMeme",
                    "MEME",
                    "https://example.com/image.png",
                    "A test meme token",
                    { value: creationFee }
                )
            ).to.emit(launchpad, "TokenCreated");

            const tokens = await launchpad.getAllTokens();
            expect(tokens.length).to.equal(1);
            tokenAddress = tokens[0];

            const tokenInfo = await launchpad.getTokenInfo(tokenAddress);
            expect(tokenInfo.name).to.equal("TestMeme");
            expect(tokenInfo.symbol).to.equal("MEME");
            expect(tokenInfo.creator).to.equal(creator.address);
        });

        it("Should fail with insufficient creation fee", async function () {
            const insufficientFee = ethers.parseEther("0.0001");
            
            await expect(
                launchpad.connect(creator).createToken(
                    "TestMeme",
                    "MEME",
                    "https://example.com/image.png",
                    "A test meme token",
                    { value: insufficientFee }
                )
            ).to.be.revertedWith("Insufficient creation fee");
        });
    });

    describe("Token Trading", function () {
        beforeEach(async function () {
            const creationFee = ethers.parseEther("0.1");
            await launchpad.connect(creator).createToken(
                "TestMeme",
                "MEME",
                "https://example.com/image.png",
                "A test meme token",
                { value: creationFee }
            );
            
            const tokens = await launchpad.getAllTokens();
            tokenAddress = tokens[0];
        });

        it("Should buy tokens correctly", async function () {
            const buyAmount = ethers.parseEther("1");
            
            await expect(
                launchpad.connect(buyer).buyTokens(tokenAddress, { value: buyAmount })
            ).to.emit(launchpad, "TokenPurchased");

            const MemeToken = await ethers.getContractFactory("MemeToken");
            const token = MemeToken.attach(tokenAddress);
            const buyerBalance = await token.balanceOf(buyer.address);
            
            expect(buyerBalance).to.be.gt(0);
        });

        it("Should sell tokens correctly", async function () {
            const buyAmount = ethers.parseEther("1");
            await launchpad.connect(buyer).buyTokens(tokenAddress, { value: buyAmount });

            const MemeToken = await ethers.getContractFactory("MemeToken");
            const token = MemeToken.attach(tokenAddress);
            const buyerBalance = await token.balanceOf(buyer.address);

            await token.connect(buyer).approve(launchpad.target, buyerBalance);
            
            await expect(
                launchpad.connect(buyer).sellTokens(tokenAddress, buyerBalance / 2n)
            ).to.emit(launchpad, "TokenSold");
        });

        it("Should graduate token after reaching threshold", async function () {
            const graduationAmount = ethers.parseEther("85");
            
            await expect(
                launchpad.connect(buyer).buyTokens(tokenAddress, { value: graduationAmount })
            ).to.emit(launchpad, "TokenGraduated");

            const tokenInfo = await launchpad.getTokenInfo(tokenAddress);
            expect(tokenInfo.graduatedToDeX).to.be.true;
        });
    });

    describe("Price Calculations", function () {
        beforeEach(async function () {
            const creationFee = ethers.parseEther("0.1");
            await launchpad.connect(creator).createToken(
                "TestMeme",
                "MEME", 
                "https://example.com/image.png",
                "A test meme token",
                { value: creationFee }
            );
            
            const tokens = await launchpad.getAllTokens();
            tokenAddress = tokens[0];
        });

        it("Should return correct token price", async function () {
            const price = await launchpad.getTokenPrice(tokenAddress);
            expect(price).to.be.gt(0);
        });

        it("Should calculate tokens for STT correctly", async function () {
            const sttAmount = ethers.parseEther("1");
            const tokensOut = await launchpad.getTokensForStt(tokenAddress, sttAmount);
            expect(tokensOut).to.be.gt(0);
        });

        it("Should calculate STT for tokens correctly", async function () {
            const tokenAmount = ethers.parseEther("1000");
            const sttOut = await launchpad.getSttForTokens(tokenAddress, tokenAmount);
            expect(sttOut).to.be.gt(0);
        });
    });

    describe("Admin Functions", function () {
        it("Should withdraw platform fees", async function () {
            const creationFee = ethers.parseEther("0.1");
            await launchpad.connect(creator).createToken(
                "TestMeme",
                "MEME",
                "https://example.com/image.png", 
                "A test meme token",
                { value: creationFee }
            );

            const initialBalance = await ethers.provider.getBalance(feeRecipient.address);
            await launchpad.connect(owner).withdrawPlatformFees();
            const finalBalance = await ethers.provider.getBalance(feeRecipient.address);

            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should set fee recipient", async function () {
            const newFeeRecipient = buyer.address;
            await launchpad.connect(owner).setFeeRecipient(newFeeRecipient);
            expect(await launchpad.feeRecipient()).to.equal(newFeeRecipient);
        });
    });
});