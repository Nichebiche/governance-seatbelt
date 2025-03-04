import { formatEther } from "viem";
import { getContractName } from "../utils/clients/tenderly";
import type { ProposalCheck, CallTrace } from "../types";

// Define a type that captures the common structure we need for processing calls
interface CallWithBalances {
	from?: string;
	to?: string;
	from_balance?: string | null;
	to_balance?: string | null;
	// Use an array of objects with the same structure to avoid complex nested type issues
	// This is a recursive type definition
	calls?: Array<CallWithBalances>;
}

/**
 * Reports all ETH balance changes from the proposal
 */
export const checkEthBalanceChanges: ProposalCheck = {
	name: "Reports all ETH balance changes from the proposal",
	async checkProposal(_, sim) {
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

			// Skip very small changes (likely due to gas costs)
			if (Math.abs(diff) < 0.0001) continue;

			const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
			info.push(
				`${name} (${address}): ${beforeEth} ETH → ${afterEth} ETH (${diffStr} ETH)`,
			);
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
	// Same type casting needed to work with the simplified interface
	processBalanceChanges(callTrace as CallWithBalances, balanceChanges);

	// Process nested calls recursively
	if (callTrace.calls && callTrace.calls.length > 0) {
		/**
		 * Type casting explanation:
		 *
		 * The Tenderly types use different interfaces at each nesting level
		 * (CallTraceCall → PurpleCall → FluffyCall → TentacledCall) but with similar structures.
		 *
		 * We use `as CallWithBalances[]` to simplify working with this complex hierarchy.
		 * Our interface focuses only on the properties we need, with a consistent recursive structure.
		 */
		processNestedCalls(callTrace.calls as CallWithBalances[], balanceChanges);
	}
}

// Helper function to process balance changes for a single call
function processBalanceChanges(
	call: CallWithBalances,
	balanceChanges: Record<string, { before: string; after: string }>,
) {
	if (call.from && call.from_balance) {
		const from = call.from.toLowerCase();
		if (!balanceChanges[from]) {
			balanceChanges[from] = {
				before: call.from_balance,
				after: call.from_balance,
			};
		} else {
			balanceChanges[from].after = call.from_balance;
		}
	}
	if (call.to && call.to_balance) {
		const to = call.to.toLowerCase();
		if (!balanceChanges[to]) {
			balanceChanges[to] = {
				before: call.to_balance,
				after: call.to_balance,
			};
		} else {
			balanceChanges[to].after = call.to_balance;
		}
	}
}

// Helper function to process nested calls
function processNestedCalls(
	calls: CallWithBalances[],
	balanceChanges: Record<string, { before: string; after: string }>,
) {
	for (const call of calls) {
		// Process this call's balance changes
		processBalanceChanges(call, balanceChanges);

		// Process nested calls recursively
		if (call.calls && call.calls.length > 0) {
			// Same type casting needed for nested call levels
			processNestedCalls(call.calls as CallWithBalances[], balanceChanges);
		}
	}
}
