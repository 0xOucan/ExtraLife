import type { Abi } from "viem";

export const oncePolicyAbi: Abi = [
  {
    type: "function",
    name: "createPolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "insured", type: "address" },
      { name: "beneficiary", type: "address" },
      { name: "insuredName", type: "string" },
      { name: "age", type: "uint8" },
      { name: "gender", type: "uint8" },
      { name: "region", type: "string" },
      { name: "sumAssured", type: "uint256" },
      { name: "premium", type: "uint256" }
    ],
    outputs: []
  }
];