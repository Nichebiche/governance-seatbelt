import { formatEther } from "viem";
import { getContractName } from "../utils/clients/tenderly";
import { bullet } from "../presentation/report";
import type { ProposalCheck, CallTrace } from "../types";

/**
 * Reports all ETH balance changes from the proposal
 */
export const checkEthBalanceChanges: ProposalCheck = {
	name: "Reports all ETH balance changes from the proposal",
	async checkProposal(proposal, sim, deps) {
		const info: string[] = [];
		const warnings: string[] = [];

		// Track balance changes by address
		const balanceChanges: Record<string, { before: string; after: string }> =
			{};

		// Extract balance changes from call trace
		if (sim.transaction.transaction_info.call_trace) {
			processCallTrace(
				sim.transaction.transaction_info.call_trace,
				balanceChanges,
			);
		}

		// If no balance changes, return early
		if (Object.keys(balanceChanges).length === 0) {
			return { info: ["No ETH balance changes"], warnings: [], errors: [] };
		}

		// Format and report balance changes
		for (const [address, { before, after }] of Object.entries(balanceChanges)) {
			const contract = sim.contracts.find(
				(c) => c.address.toLowerCase() === address.toLowerCase(),
			);
			const name = getContractName(contract);

			const beforeEth = formatEther(BigInt(before));
			const afterEth = formatEther(BigInt(after));
			const diff = Number(afterEth) - Number(beforeEth);

			// Only show significant changes (avoid dust amounts)
			if (Math.abs(diff) > 0.000001) {
				const change = diff > 0 ? `+${diff}` : `${diff}`;
				info.push(
					bullet(`${name}: ${beforeEth} ETH → ${afterEth} ETH (${change} ETH)`),
				);
			}
		}

		return { info, warnings, errors: [] };
	},
};

// Helper function to process call trace and extract balance changes
function processCallTrace(
	callTrace: CallTrace,
	balanceChanges: Record<string, { before: string; after: string }>,
) {
	// Process the main call
	if (callTrace.from && callTrace.from_balance) {
		const from = callTrace.from.toLowerCase();
		balanceChanges[from] = balanceChanges[from] || {
			before: callTrace.from_balance,
			after: callTrace.from_balance,
		};
		// Always update the 'after' balance with the latest seen value
		balanceChanges[from].after = callTrace.from_balance;
	}

	if (callTrace.to && callTrace.to_balance) {
		const to = callTrace.to.toLowerCase();
		balanceChanges[to] = balanceChanges[to] || {
			before: callTrace.to_balance,
			after: callTrace.to_balance,
		};
		// Always update the 'after' balance with the latest seen value
		balanceChanges[to].after = callTrace.to_balance;
	}

	// Process nested calls recursively
	if (callTrace.calls && callTrace.calls.length > 0) {
		processNestedCalls(callTrace.calls, balanceChanges);
	}
}

// Helper function to process nested calls
function processNestedCalls(
	calls: unknown[],
	balanceChanges: Record<string, { before: string; after: string }>,
) {
	for (const call of calls) {
		// We need to use type assertion since we're using unknown type
		const typedCall = call as {
			from?: string;
			to?: string;
			from_balance?: string;
			to_balance?: string;
			calls?: unknown[];
		};

		if (typedCall.from && typedCall.from_balance) {
			const from = typedCall.from.toLowerCase();
			if (balanceChanges[from]) {
				// Update the 'after' balance with the latest value
				balanceChanges[from].after = typedCall.from_balance;
			} else {
				balanceChanges[from] = {
					before: typedCall.from_balance,
					after: typedCall.from_balance,
				};
			}
		}

		if (typedCall.to && typedCall.to_balance) {
			const to = typedCall.to.toLowerCase();
			if (balanceChanges[to]) {
				// Update the 'after' balance with the latest value
				balanceChanges[to].after = typedCall.to_balance;
			} else {
				balanceChanges[to] = {
					before: typedCall.to_balance,
					after: typedCall.to_balance,
				};
			}
		}

		// Process further nested calls recursively
		if (typedCall.calls && typedCall.calls.length > 0) {
			processNestedCalls(typedCall.calls, balanceChanges);
		}
	}
}
