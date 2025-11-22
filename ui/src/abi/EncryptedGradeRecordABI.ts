/*
  This file contains the ABI for EncryptedGradeRecord contract.
  Extracted from the factory class to avoid import issues during build.
*/
export const EncryptedGradeRecordABI = [
  {
    inputs: [],
    name: "HandlesAlreadySavedForRequestID",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint32",
        name: "averageScore",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "totalCount",
        type: "uint32",
      },
    ],
    name: "GlobalStatsPublished",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
    ],
    name: "GlobalStatsRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "entryId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "GradeDeleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "entryId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "student",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "subject",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "GradeSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "student",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "averageScore",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "count",
        type: "uint32",
      },
    ],
    name: "StudentStatsPublished",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "student",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
    ],
    name: "StudentStatsRequested",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "entryId",
        type: "uint256",
      },
    ],
    name: "deleteGrade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "entryCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getEncryptedGlobalStats",
    outputs: [
      {
        internalType: "euint32",
        name: "encryptedSum",
        type: "bytes32",
      },
      {
        internalType: "uint32",
        name: "count",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "entryId",
        type: "uint256",
      },
    ],
    name: "getEncryptedScore",
    outputs: [
      {
        internalType: "euint32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "getEncryptedStudentStats",
    outputs: [
      {
        internalType: "euint32",
        name: "encryptedSum",
        type: "bytes32",
      },
      {
        internalType: "uint32",
        name: "count",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "entryId",
        type: "uint256",
      },
    ],
    name: "getEntry",
    outputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
      {
        internalType: "string",
        name: "subject",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getEntryCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGlobalStats",
    outputs: [
      {
        internalType: "uint32",
        name: "averageScore",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "totalCount",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "getStudentEntries",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "getStudentEntryCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "getStudentStats",
    outputs: [
      {
        internalType: "uint32",
        name: "averageScore",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "count",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "cleartexts",
        type: "bytes",
      },
      {
        internalType: "bytes[]",
        name: "",
        type: "bytes[]",
      },
    ],
    name: "globalStatsCallback",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "gradeEntries",
    outputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
      {
        internalType: "string",
        name: "subject",
        type: "string",
      },
      {
        internalType: "euint32",
        name: "encryptedScore",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isGlobalStatsFinalized",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "isStudentStatsFinalized",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "requestGlobalStats",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "requestStudentStats",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "studentEntries",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "studentEntryCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "cleartexts",
        type: "bytes",
      },
      {
        internalType: "bytes[]",
        name: "",
        type: "bytes[]",
      },
    ],
    name: "studentStatsCallback",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "externalEuint32",
        name: "encryptedScore",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
      {
        internalType: "string",
        name: "subject",
        type: "string",
      },
    ],
    name: "submitGrade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
