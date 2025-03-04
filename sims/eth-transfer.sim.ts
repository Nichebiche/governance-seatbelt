/**
 * @notice Simulation configuration file for ETH transfers.
 * This simulation is designed to test ETH balance tracking during proposal execution.
 */
import type { SimulationConfigNew } from "../types";
import { parseEther } from "viem";

// Define the ETH transfer parameters
// This proposal will send 0.1 ETH from the governor to the target address
const recipient = "0x0000000000000000000000000000000000000123"; // Example recipient

// Define the governor address
const governorAddress = "0x408ED6354d4973f66138C91495F2f2FCbd8724C3"; // Uniswap governor

// Note: To make this work properly, we would need to ensure the governor has ETH.
// In a real simulation, the simulateNew function in utils/clients/tenderly.ts
// would need to be updated to handle state overrides for balances.

export const config: SimulationConfigNew = {
	type: "new",
	daoName: "ETH Transfer Test",
	governorType: "bravo",
	governorAddress,
	// Send ETH from the governor to the recipient
	targets: [recipient],
	values: [parseEther("0.1").toString()], // Send 0.1 ETH
	signatures: [""],
	calldatas: ["0x"], // Empty calldata for pure ETH transfer
	description: "Send 0.1 ETH to test address",
};
