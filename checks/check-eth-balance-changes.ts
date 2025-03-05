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

		console.log(sim.transaction.transaction_info.balance_changes);

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
		const proposalTargets = proposal.targets.map((t) => t.toLowerCase());

		// Helper function to find a contract by address
		const findContractByAddress = (address: string) => {
			return sim.contracts.find(
				(c) => getAddress(c.address).toLowerCase() === address.toLowerCase(),
			);
		};

		// Process each ETH transfer for descriptive messages
		for (const transfer of ethTransfers) {
			const from = getAddress(transfer.from);
			const to = getAddress(transfer.to);
			const fromLower = from.toLowerCase();
			const toLower = to.toLowerCase();

			// Find contracts if they exist
			const fromContract = findContractByAddress(from);
			const toContract = findContractByAddress(to);

			// Format the from/to descriptions more clearly with Etherscan links
			const fromName = fromContract
				? `[${getContractName(fromContract).split(" at ")[0]}](https://etherscan.io/address/${from})`
				: `[EOA (${from})](https://etherscan.io/address/${from})`;
			const toName = toContract
				? `[${getContractName(toContract).split(" at ")[0]}](https://etherscan.io/address/${to})`
				: `[EOA (${to})](https://etherscan.io/address/${to})`;

			// Create appropriate message based on the transfer context
			let message = "";

			if (fromLower === timelockAddress && proposalTargets.includes(toLower)) {
				message = `• ${fromName} sent ${transfer.amount} ETH to ${toName} as part of the proposal execution`;
				significantChanges.push(message);
			} else if (fromLower === governorAddress && toLower === timelockAddress) {
				message = `• ${fromName} sent ${transfer.amount} ETH to ${toName} for proposal execution`;
				significantChanges.push(message);
			} else if (proposalTargets.includes(toLower)) {
				message = `• ${toName} received ${transfer.amount} ETH as part of the proposal`;
				significantChanges.push(message);
			} else if (Number.parseFloat(transfer.amount) >= 0.01) {
				// For other significant transfers (>= 0.01 ETH)
				message = `• ${fromName} sent ${transfer.amount} ETH to ${toName}`;
				significantChanges.push(message);
			} else {
				// For minor transfers
				message = `• ${transfer.amount} ETH transferred from ${fromName} to ${toName}`;
				minorChanges.push(message);
			}
		}

		// Add a blank line after the transfer messages
		if (significantChanges.length > 0) {
			significantChanges.push("");
		}

		// Add a table for balance changes if available
		if (
			sim.transaction.transaction_info.balance_changes &&
			sim.transaction.transaction_info.balance_changes.length > 0
		) {
			// Create table header
			significantChanges.push("\n**ETH Balance Changes**");
			significantChanges.push("| Address | Description | Net ETH Change |");
			significantChanges.push("| ------- | ----------- | ------------- |");

			// Get addresses involved in ETH transfers to verify balance changes are ETH-related
			const ethAddresses = new Set<string>();
			for (const transfer of ethTransfers) {
				ethAddresses.add(transfer.from.toLowerCase());
				ethAddresses.add(transfer.to.toLowerCase());
			}

			// Create a map to calculate net ETH changes for each address
			const netEthChanges = new Map<string, number>();

			// Calculate net ETH changes from transfers
			for (const transfer of ethTransfers) {
				const fromLower = transfer.from.toLowerCase();
				const toLower = transfer.to.toLowerCase();
				const amount = Number.parseFloat(transfer.amount);

				// Subtract from sender
				netEthChanges.set(
					fromLower,
					(netEthChanges.get(fromLower) || 0) - amount,
				);

				// Add to receiver
				netEthChanges.set(toLower, (netEthChanges.get(toLower) || 0) + amount);
			}

			// Sort balance changes by address for consistency
			const sortedBalanceChanges = [
				...sim.transaction.transaction_info.balance_changes,
			]
				.filter((change) => ethAddresses.has(change.address.toLowerCase())) // Only include addresses involved in ETH transfers
				.sort((a, b) =>
					a.address.toLowerCase().localeCompare(b.address.toLowerCase()),
				);

			if (sortedBalanceChanges.length === 0) {
				significantChanges.push(
					"| | No relevant ETH balance changes detected | |",
				);
			} else {
				// Add each balance change to the table
				for (const change of sortedBalanceChanges) {
					const address = getAddress(change.address);
					const addressLower = address.toLowerCase();
					const contract = findContractByAddress(address);

					// Format description based on whether it's a contract or EOA
					const description = contract
						? getContractName(contract).split(" at ")[0]
						: "EOA";

					// Get the net ETH change for this address
					const netChange = netEthChanges.get(addressLower) || 0;

					// Format the ETH change with sign, fixed precision, and color coding
					let formattedChange: string;
					if (netChange > 0) {
						// Green for positive changes
						formattedChange = `<span style="color:green">+${netChange.toFixed(4)} ETH</span>`;
					} else if (netChange < 0) {
						// Red for negative changes
						formattedChange = `<span style="color:red">${netChange.toFixed(4)} ETH</span>`;
					} else {
						// Gray for zero changes
						formattedChange = `<span style="color:gray">${netChange.toFixed(4)} ETH</span>`;
					}

					// Add row to table
					significantChanges.push(
						`| \`${address}\` | ${description} | ${formattedChange} |`,
					);
				}
			}

			significantChanges.push("");
		}

		// Return the collected info
		if (significantChanges.length > 0) {
			info.push(...significantChanges);
		}
		if (minorChanges.length > 0) {
			info.push("Minor ETH transfers:");
			info.push(...minorChanges);
		}

		return { info, warnings, errors };
	},
};
