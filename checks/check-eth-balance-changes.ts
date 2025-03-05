import { getAddress } from "viem";
import { getContractName } from "../utils/clients/tenderly";
import type { ProposalCheck } from "../types";

/**
 * Reports all ETH balance changes from the proposal
 */
export const checkEthBalanceChanges: ProposalCheck = {
	name: "Reports all ETH balance changes from the proposal",
	async checkProposal(proposal, sim) {
		const info: string[] = [];
		const warnings: string[] = [];
		const errors: string[] = [];

		if (!sim.transaction.transaction_info.asset_changes) {
			return { info: ["No ETH transfers detected"], warnings, errors };
		}

		// Filter for ETH transfers
		const ethTransfers = sim.transaction.transaction_info.asset_changes.filter(
			(change) => change.token_info.type === "Native",
		);

		if (ethTransfers.length === 0) {
			return { info: ["No ETH transfers detected"], warnings, errors };
		}

		// Process ETH transfers
		const significantChanges: string[] = [];
		const minorChanges: string[] = [];

		// Identify key addresses in the transaction
		const governorAddress = sim.transaction.to.toLowerCase();
		const timelockAddress = sim.contracts
			.find((c) => c.contract_name.toLowerCase().includes("timelock"))
			?.address.toLowerCase();

		// Find target addresses from the proposal
		const targetAddresses = proposal.targets.map((t) => t.toLowerCase());

		// Process each ETH transfer
		for (const transfer of ethTransfers) {
			const { from, to, amount: amountFormatted } = transfer;
			const fromAddress = getAddress(from);
			const toAddress = getAddress(to);

			// Get contract names if available
			const fromContract = sim.contracts.find(
				(c) => getAddress(c.address) === fromAddress,
			);
			const toContract = sim.contracts.find(
				(c) => getAddress(c.address) === toAddress,
			);

			const fromName = getContractName(fromContract);
			const toName = getContractName(toContract);

			// Determine if this is a significant transfer
			const isFromGovernor = fromAddress === governorAddress;
			const isFromTimelock = timelockAddress && fromAddress === timelockAddress;
			const isToTarget = targetAddresses.includes(toAddress);
			const isToTimelock = timelockAddress && toAddress === timelockAddress;

			// Create appropriate message based on the transfer context
			let message = "";

			if (isFromTimelock && isToTarget) {
				message = `${toName} (${toAddress}): Received ${amountFormatted} ETH from Timelock as part of the proposal`;
				significantChanges.push(message);
			} else if (isFromGovernor && isToTimelock) {
				message = `${fromName} (${fromAddress}): Sent ${amountFormatted} ETH to Timelock for proposal execution`;
				significantChanges.push(message);
			} else if (isToTarget) {
				message = `${toName} (${toAddress}): Received ${amountFormatted} ETH as part of the proposal`;
				significantChanges.push(message);
			} else if (Number(amountFormatted) >= 0.01) {
				// For other significant transfers (>= 0.01 ETH)
				message = `${fromName} (${fromAddress}) sent ${amountFormatted} ETH to ${toName} (${toAddress})`;
				significantChanges.push(message);
			} else {
				// For minor transfers
				message = `${amountFormatted} ETH transferred from ${fromName} to ${toName}`;
				minorChanges.push(message);
			}
		}

		info.push(...significantChanges);
		info.push(...minorChanges);

		return { info, warnings, errors };
	},
};
