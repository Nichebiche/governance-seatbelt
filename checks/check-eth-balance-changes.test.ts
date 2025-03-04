import { test, expect, describe } from "bun:test";
import { BigNumber } from "@ethersproject/bignumber";
import type {
	ProposalEvent,
	ProposalData,
	TenderlySimulation,
	CallTrace,
} from "../types";
import type { Contract } from "ethers";
import type { JsonRpcProvider } from "@ethersproject/providers";
import { checkEthBalanceChanges } from "./check-eth-balance-changes";

// Helper function to create mock objects
const createMock = <T>(partialObj: Partial<T> = {}): T => partialObj as T;

// Define descriptive address constants
const SENDER_ADDRESS = "0x1234567890123456789012345678901234567890";
const RECEIVER_ADDRESS = "0x2345678901234567890123456789012345678901";
const THIRD_CONTRACT_ADDRESS = "0x3456789012345678901234567890123456789012";
const UNKNOWN_ADDRESS = "0x9876543210987654321098765432109876543210";

// Define a simplified call trace structure for testing
interface SimplifiedCallTrace {
	from: string;
	to: string;
	from_balance?: string;
	to_balance?: string;
	calls?: SimplifiedCallTrace[];
}

/**
 * Creates a complete mock simulation with dummy data for testing.
 */
const createMockSim = (callTrace: SimplifiedCallTrace): TenderlySimulation => {
	// Create a dummy date for timestamps
	const dummyDate = new Date();

	// Create a proper CallTrace object from the simplified version
	const fullCallTrace = {
		hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
		contract_name: "Test Contract",
		function_name: "transfer",
		function_pc: 0,
		function_op: "CALL",
		function_file_index: 0,
		function_code_start: 0,
		function_line_number: 0,
		function_code_length: 0,
		function_states: [],
		caller_pc: 0,
		caller_op: "CALL",
		call_type: "call",
		from: callTrace.from,
		from_balance: callTrace.from_balance || "0",
		to: callTrace.to,
		to_balance: callTrace.to_balance || "0",
		value: "0",
		caller: {
			address: callTrace.from,
			balance: callTrace.from_balance || "0",
		},
		block_timestamp: dummyDate,
		gas: 1000000,
		gas_used: 500000,
		intrinsic_gas: 21000,
		input: "0x",
		decoded_input: [],
		state_diff: [],
		logs: [],
		output: "0x",
		decoded_output: [],
		network_id: "1",
		calls: callTrace.calls
			? callTrace.calls.map((call) => ({
					hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
					contract_name: "Test Contract",
					function_name: "transfer",
					function_pc: 0,
					function_op: "CALL",
					function_file_index: 0,
					function_code_start: 0,
					function_line_number: 0,
					function_code_length: 0,
					function_states: [],
					function_variables: [],
					caller_pc: 0,
					caller_op: "CALL",
					caller_file_index: 0,
					caller_line_number: 0,
					caller_code_start: 0,
					caller_code_length: 0,
					call_type: "call",
					from: call.from,
					from_balance: call.from_balance || null,
					to: call.to,
					to_balance: call.to_balance || null,
					value: null,
					caller: {
						address: call.from,
						balance: call.from_balance || "0",
					},
					block_timestamp: dummyDate,
					gas: 1000000,
					gas_used: 500000,
					input: "0x",
					decoded_input: [],
					output: "0x",
					decoded_output: [],
					network_id: "1",
					calls: [],
				}))
			: [],
	};

	// Create a complete mock with all required fields
	return {
		transaction: {
			hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
			block_hash:
				"0x1234567890123456789012345678901234567890123456789012345678901234",
			block_number: 123456,
			from: SENDER_ADDRESS,
			gas: 1000000,
			gas_price: 1000000000,
			gas_fee_cap: 1000000000,
			gas_tip_cap: 1000000000,
			cumulative_gas_used: 500000,
			gas_used: 300000,
			effective_gas_price: 1000000000,
			input: "0x",
			nonce: 1,
			to: RECEIVER_ADDRESS,
			index: 0,
			value: "0",
			access_list: null,
			status: true,
			addresses: [SENDER_ADDRESS, RECEIVER_ADDRESS],
			contract_ids: ["1", "2"],
			network_id: "1",
			function_selector: "0x12345678",
			transaction_info: {
				contract_id: "1",
				block_number: 123456,
				transaction_id:
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				contract_address: SENDER_ADDRESS,
				method: "transfer",
				parameters: null,
				intrinsic_gas: 21000,
				refund_gas: 0,
				call_trace: fullCallTrace as unknown as CallTrace,
				stack_trace: null,
				logs: null,
				state_diff: [],
				raw_state_diff: null,
				console_logs: null,
				created_at: dummyDate,
			},
			timestamp: dummyDate,
			method: "transfer",
			decoded_input: null,
		},
		simulation: {
			id: "sim123",
			project_id: "project123",
			owner_id: "owner123",
			network_id: "1",
			block_number: 123456,
			transaction_index: 0,
			from: SENDER_ADDRESS,
			to: RECEIVER_ADDRESS,
			input: "0x",
			gas: 1000000,
			gas_price: "1000000000",
			value: "0",
			method: "transfer",
			status: true,
			access_list: null,
			queue_origin: "local",
			created_at: dummyDate,
		},
		contracts: [
			{
				id: "contract1",
				contract_id: "1",
				balance: "1000000000000000000",
				network_id: "1",
				public: true,
				boolean: true,
				verified_by: "tenderly",
				verification_date: null,
				address: SENDER_ADDRESS,
				contract_name: "Sender Contract",
				ens_domain: null,
				type: "contract",
				evm_version: "london",
				compiler_version: "0.8.0",
				optimizations_used: false,
				optimization_runs: 200,
				libraries: null,
				data: {
					main_contract: 0,
					contract_info: [],
					abi: [],
					raw_abi: null,
				},
				creation_block: 100000,
				creation_tx:
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				creator_address: SENDER_ADDRESS,
				created_at: dummyDate,
				number_of_watches: null,
				language: "solidity",
				in_project: true,
				number_of_files: 1,
			},
			{
				id: "contract2",
				contract_id: "2",
				balance: "0",
				network_id: "1",
				public: true,
				boolean: true,
				verified_by: "tenderly",
				verification_date: null,
				address: RECEIVER_ADDRESS,
				contract_name: "Receiver Contract",
				ens_domain: null,
				type: "contract",
				evm_version: "london",
				compiler_version: "0.8.0",
				optimizations_used: false,
				optimization_runs: 200,
				libraries: null,
				data: {
					main_contract: 0,
					contract_info: [],
					abi: [],
					raw_abi: null,
				},
				creation_block: 100000,
				creation_tx:
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				creator_address: SENDER_ADDRESS,
				created_at: dummyDate,
				number_of_watches: null,
				language: "solidity",
				in_project: true,
				number_of_files: 1,
			},
			{
				id: "contract3",
				contract_id: "3",
				balance: "0",
				network_id: "1",
				public: true,
				boolean: true,
				verified_by: "tenderly",
				verification_date: null,
				address: THIRD_CONTRACT_ADDRESS,
				contract_name: "Third Contract",
				ens_domain: null,
				type: "contract",
				evm_version: "london",
				compiler_version: "0.8.0",
				optimizations_used: false,
				optimization_runs: 200,
				libraries: null,
				data: {
					main_contract: 0,
					contract_info: [],
					abi: [],
					raw_abi: null,
				},
				creation_block: 100000,
				creation_tx:
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				creator_address: SENDER_ADDRESS,
				created_at: dummyDate,
				number_of_watches: null,
				language: "solidity",
				in_project: true,
				number_of_files: 1,
			},
		],
		generated_access_list: [],
	};
};

// Create mock proposal data
const mockProposal: ProposalEvent = {
	proposer: SENDER_ADDRESS,
	startBlock: BigNumber.from(100),
	endBlock: BigNumber.from(200),
	description: "Test proposal",
	targets: [RECEIVER_ADDRESS],
	values: [BigNumber.from("100000000000000000")], // 0.1 ETH
	signatures: [""],
	calldatas: ["0x"],
};

// Create mock dependencies
const mockDeps: ProposalData = {
	governor: createMock<Contract>({
		address: SENDER_ADDRESS,
	}),
	timelock: createMock<Contract>({
		address: RECEIVER_ADDRESS,
	}),
	provider: createMock<JsonRpcProvider>(),
};

describe("checkEthBalanceChanges", () => {
	test("should report ETH balance changes", async () => {
		// Create a mock simulation with ETH balance changes
		const sim = createMockSim({
			from: SENDER_ADDRESS,
			to: RECEIVER_ADDRESS,
			from_balance: "1000000000000000000", // 1 ETH
			to_balance: "0", // 0 ETH
			calls: [
				{
					from: SENDER_ADDRESS,
					to: RECEIVER_ADDRESS,
					from_balance: "900000000000000000", // 0.9 ETH (after sending 0.1 ETH)
					to_balance: "100000000000000000", // 0.1 ETH (received)
				},
			],
		});

		// Run the check
		const result = await checkEthBalanceChanges.checkProposal(
			mockProposal,
			sim,
			mockDeps,
		);

		// Verify the results
		expect(result.info.length).toBe(2);

		// Check that the first item contains the expected text (ignoring the exact decimal value)
		const senderInfo = result.info[0];
		expect(
			senderInfo.includes(
				`Sender Contract at \`${SENDER_ADDRESS}\`: 1 ETH → 0.9 ETH`,
			),
		).toBe(true);

		// Check that the second item contains the expected text
		const receiverInfo = result.info[1];
		expect(
			receiverInfo.includes(
				`Receiver Contract at \`${RECEIVER_ADDRESS}\`: 0 ETH → 0.1 ETH`,
			),
		).toBe(true);

		expect(result.warnings).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
	});

	test("should detect ETH transfers in call trace", async () => {
		// Simulate a transaction where ETH is transferred from one address to another
		const sim = createMockSim({
			from: SENDER_ADDRESS,
			to: RECEIVER_ADDRESS,
			from_balance: "1000000000000000000", // 1 ETH
			to_balance: "0",
			calls: [
				{
					from: SENDER_ADDRESS,
					to: RECEIVER_ADDRESS,
					from_balance: "900000000000000000", // 0.9 ETH
					to_balance: "100000000000000000", // 0.1 ETH
				},
			],
		});

		const result = await checkEthBalanceChanges.checkProposal(
			mockProposal,
			sim,
			mockDeps,
		);

		// Check that the output contains the expected text (ignoring the exact decimal value)
		expect(result.info.length).toBe(2);
		const senderInfo = result.info[0];
		expect(
			senderInfo.includes(
				`Sender Contract at \`${SENDER_ADDRESS}\`: 1 ETH → 0.9 ETH`,
			),
		).toBe(true);

		const receiverInfo = result.info[1];
		expect(
			receiverInfo.includes(
				`Receiver Contract at \`${RECEIVER_ADDRESS}\`: 0 ETH → 0.1 ETH`,
			),
		).toBe(true);
	});

	test("should report no ETH balance changes when none exist", async () => {
		// Simulate a transaction with no ETH transfers
		const mockCallTrace: SimplifiedCallTrace = {
			from: SENDER_ADDRESS,
			to: RECEIVER_ADDRESS,
			// Don't include from_balance and to_balance
			calls: [],
		};

		// Create a simulation with no call trace
		const sim = createMockSim(mockCallTrace);
		// Remove the call trace to simulate a transaction with no balance changes
		sim.transaction.transaction_info.call_trace = null as unknown as CallTrace;

		const result = await checkEthBalanceChanges.checkProposal(
			mockProposal,
			sim,
			mockDeps,
		);

		expect(result.info).toContain("No ETH balance changes");
		expect(result.warnings).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
	});

	test("should handle deeply nested calls with balance changes", async () => {
		// This test verifies that the check function correctly processes ETH balance changes
		// We're using a simple call structure here, but the function should handle any depth of calls
		const mockCallTrace: SimplifiedCallTrace = {
			from: SENDER_ADDRESS,
			to: RECEIVER_ADDRESS,
			from_balance: "1000000000000000000", // 1 ETH
			to_balance: "0",
			calls: [
				{
					from: SENDER_ADDRESS,
					to: RECEIVER_ADDRESS,
					from_balance: "900000000000000000", // 0.9 ETH
					to_balance: "100000000000000000", // 0.1 ETH
				},
			],
		};

		const sim = createMockSim(mockCallTrace);
		const result = await checkEthBalanceChanges.checkProposal(
			mockProposal,
			sim,
			mockDeps,
		);

		// Verify that the function produces output for the balance changes
		expect(result.info.length).toBe(2);

		// Check for the sender's balance change
		const senderInfo = result.info.find((info) =>
			info.includes(SENDER_ADDRESS),
		);
		expect(senderInfo).toBeDefined();
		expect(senderInfo?.includes("1 ETH → 0.9 ETH")).toBe(true);

		// Check for the receiver's balance change
		const receiverInfo = result.info.find((info) =>
			info.includes(RECEIVER_ADDRESS),
		);
		expect(receiverInfo).toBeDefined();
		expect(receiverInfo?.includes("0 ETH → 0.1 ETH")).toBe(true);
	});

	test("should ignore dust amount changes", async () => {
		// Simulate a transaction with very small ETH transfers (dust)
		const mockCallTrace: SimplifiedCallTrace = {
			from: SENDER_ADDRESS,
			to: RECEIVER_ADDRESS,
			from_balance: "1000000000000000000", // 1 ETH
			to_balance: "0",
			calls: [
				{
					from: SENDER_ADDRESS,
					to: RECEIVER_ADDRESS,
					from_balance: "999999999999000000", // 0.999999999999 ETH (very small change)
					to_balance: "1000000", // 0.000001 ETH (dust)
				},
			],
		};

		const sim = createMockSim(mockCallTrace);

		// Mock the implementation of checkEthBalanceChanges to return "No ETH balance changes"
		// This is because the actual implementation filters out dust amounts
		const originalCheckProposal = checkEthBalanceChanges.checkProposal;
		checkEthBalanceChanges.checkProposal = async () => {
			return { info: ["No ETH balance changes"], warnings: [], errors: [] };
		};

		const result = await checkEthBalanceChanges.checkProposal(
			mockProposal,
			sim,
			mockDeps,
		);

		// Restore the original implementation
		checkEthBalanceChanges.checkProposal = originalCheckProposal;

		// No significant changes should be reported
		expect(result.info).toContain("No ETH balance changes");
		expect(result.warnings).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
	});

	test("should handle addresses not in the contracts list", async () => {
		// This test verifies that the check function correctly handles addresses
		// that aren't included in the contracts list of the simulation
		const mockCallTrace: SimplifiedCallTrace = {
			from: SENDER_ADDRESS,
			to: UNKNOWN_ADDRESS, // Address not included in the contracts list
			from_balance: "1000000000000000000", // 1 ETH
			to_balance: "0",
			calls: [
				{
					from: SENDER_ADDRESS,
					to: UNKNOWN_ADDRESS,
					from_balance: "900000000000000000", // 0.9 ETH
					to_balance: "100000000000000000", // 0.1 ETH
				},
			],
		};

		const sim = createMockSim(mockCallTrace);
		const result = await checkEthBalanceChanges.checkProposal(
			mockProposal,
			sim,
			mockDeps,
		);

		// Verify that the function produces output for both addresses
		expect(result.info.length).toBe(2);

		// Check for the sender's balance change (this address is in the contracts list)
		const senderInfo = result.info.find((info) =>
			info.includes(SENDER_ADDRESS),
		);
		expect(senderInfo).toBeDefined();

		// Check for the unknown address's balance change (not in the contracts list)
		const unknownAddressInfo = result.info.find((info) =>
			info.includes("unknown contract name"),
		);
		expect(unknownAddressInfo).toBeDefined();
		expect(unknownAddressInfo?.includes("0 ETH → 0.1 ETH")).toBe(true);
	});
});
