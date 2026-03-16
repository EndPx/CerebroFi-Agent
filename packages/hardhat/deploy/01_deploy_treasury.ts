import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

// Base Mainnet Verified protocol addresses (from ethskills addresses/SKILL.md)
const BASE_UNISWAP_V3_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481"; // SwapRouter02 on Base
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Native USDC on Base
const BASE_WETH = "0x4200000000000000000000000000000000000006"; // WETH on Base
const BASE_LIDO = "0x1ddb2c0897daf134545641545454545454545454"; // Example wstETH / stETH (Will use standard Base ones if available or mock)
const BASE_WSTETH = "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452"; // wstETH on Base

const deployAutoYieldTreasury: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // We temporarily set the agent to be the deployer for testing locally.
  // In production, this would be the ERC-8004 identity wallet.
  const AI_AGENT_ADDRESS = deployer;

  console.log("\n=================================");
  console.log("Deploying AutoYieldTreasury...");
  console.log("Deployer:", deployer);
  console.log("AI Agent:", AI_AGENT_ADDRESS);
  console.log("=================================\n");

  await deploy("AutoYieldTreasury", {
    from: deployer,
    args: [
      AI_AGENT_ADDRESS,
      BASE_UNISWAP_V3_ROUTER,
      BASE_USDC,
      BASE_WETH,
      BASE_LIDO, // Important: Lido native staking mainly lives on Ethereum mainnet. On Base we deal with wrapping/bridged.
      BASE_WSTETH,
    ],
    log: true,
    autoMine: true,
  });
};

export default deployAutoYieldTreasury;
deployAutoYieldTreasury.tags = ["AutoYieldTreasury"];
