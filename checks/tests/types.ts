import type { CallTrace, TenderlySimulation } from "../../types";

/**
 * Helper function to create mock objects with proper typing
 *
 * @param partialObj Partial object to be cast as the full type
 * @returns The partial object cast as the full type
 */
export const createMock = <T>(partialObj: Partial<T> = {}): T =>
	partialObj as T;

/**
 * MinimalCallTrace represents the minimal subset of the CallTrace type needed for testing.
 *
 * This type directly references the actual CallTrace type from the types.d.ts file,
 * ensuring that if the CallTrace type changes, we'll get type errors here if needed.
 *
 * We only include the properties that are actually used by the checkEthBalanceChanges function:
 * - from: The address sending ETH
 * - to: The address receiving ETH
 * - from_balance: The balance of the sender (optional)
 * - to_balance: The balance of the receiver (optional)
 * - calls: Nested calls that might also contain balance changes
 */
export type MinimalCallTrace = {
	from: CallTrace["from"];
	to: CallTrace["to"];
	from_balance?: CallTrace["from_balance"];
	to_balance?: CallTrace["to_balance"];
	// Recursively define calls to handle nested call traces
	calls?: MinimalCallTrace[];
};

/**
 * Common address constants used in tests
 */
export const TEST_ADDRESSES = {
	SENDER: "0x1234567890123456789012345678901234567890",
	RECEIVER: "0x2345678901234567890123456789012345678901",
	THIRD_CONTRACT: "0x3456789012345678901234567890123456789012",
	UNKNOWN: "0x9876543210987654321098765432109876543210",
};

/**
 * Creates a complete mock TenderlySimulation with dummy data for testing.
 *
 * This function creates a minimal but complete TenderlySimulation object
 * that satisfies the type requirements while only populating the fields
 * that are actually used in tests.
 *
 * @param callTrace A MinimalCallTrace object containing the call trace data
 * @param options Additional options to customize the mock
 * @returns A complete TenderlySimulation object
 */
export function createMockTenderlySimulation(
	callTrace: MinimalCallTrace,
	options: {
		senderAddress?: string;
		receiverAddress?: string;
		contractNames?: Record<string, string>;
	} = {},
): TenderlySimulation {
	// Use provided options or defaults
	const senderAddress = options.senderAddress || TEST_ADDRESSES.SENDER;
	const receiverAddress = options.receiverAddress || TEST_ADDRESSES.RECEIVER;
	const contractNames = options.contractNames || {
		[TEST_ADDRESSES.SENDER]: "Sender Contract",
		[TEST_ADDRESSES.RECEIVER]: "Receiver Contract",
		[TEST_ADDRESSES.THIRD_CONTRACT]: "Third Contract",
	};

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

	// Create contracts array based on addresses in the call trace
	const uniqueAddresses = new Set<string>([
		senderAddress,
		receiverAddress,
		...Object.keys(contractNames),
	]);

	const contracts = Array.from(uniqueAddresses).map((address, index) => ({
		id: `contract${index + 1}`,
		contract_id: `${index + 1}`,
		balance: address === senderAddress ? "1000000000000000000" : "0",
		network_id: "1",
		public: true,
		boolean: true,
		verified_by: "tenderly",
		verification_date: null,
		address,
		contract_name: contractNames[address] || `Unknown Contract ${index + 1}`,
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
		creator_address: senderAddress,
		created_at: dummyDate,
		number_of_watches: null,
		language: "solidity",
		in_project: true,
		number_of_files: 1,
	}));

	// Create a complete mock with all required fields
	return {
		transaction: {
			hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
			block_hash:
				"0x1234567890123456789012345678901234567890123456789012345678901234",
			block_number: 123456,
			from: senderAddress,
			gas: 1000000,
			gas_price: 1000000000,
			gas_fee_cap: 1000000000,
			gas_tip_cap: 1000000000,
			cumulative_gas_used: 500000,
			gas_used: 300000,
			effective_gas_price: 1000000000,
			input: "0x",
			nonce: 1,
			to: receiverAddress,
			index: 0,
			value: "0",
			access_list: null,
			status: true,
			addresses: [senderAddress, receiverAddress],
			contract_ids: ["1", "2"],
			network_id: "1",
			function_selector: "0x12345678",
			transaction_info: {
				contract_id: "1",
				block_number: 123456,
				transaction_id:
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				contract_address: senderAddress,
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
			from: senderAddress,
			to: receiverAddress,
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
		contracts,
		generated_access_list: [],
	};
}
