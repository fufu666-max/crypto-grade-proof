import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useEthersSigner, useEthersProvider } from "@/hooks/useEthersSigner";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { EncryptedGradeRecordAddresses } from "@/abi/EncryptedGradeRecordAddresses";
import { EncryptedGradeRecordABI } from "@/abi/EncryptedGradeRecordABI";
import { EncryptedGradeRecord } from "../../../types/contracts/EncryptedGradeRecord";

export interface GradeEntry {
  id: bigint;
  subject: string;
  timestamp: bigint;
  isActive: boolean;
  encryptedScore?: string;
  decryptedScore?: number;
  isDecrypting?: boolean;
}

function getContractAddressByChainId(
  chainId: number | undefined
): string | undefined {
  if (!chainId) return undefined;
  const chainIdStr = chainId.toString();
  const addressInfo = EncryptedGradeRecordAddresses[chainIdStr as keyof typeof EncryptedGradeRecordAddresses];
  if (!addressInfo || addressInfo.address === "0x0000000000000000000000000000000000000000") {
    return undefined;
  }
  return addressInfo.address;
}

export const useEncryptedGradeRecord = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();

  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [studentAverage, setStudentAverage] = useState<number | null>(null);
  const [globalAverage, setGlobalAverage] = useState<number | null>(null);
  
  // Use ref to store decrypted scores to preserve them across reloads
  const decryptedScoresRef = useRef<Map<string, { decryptedScore: number; encryptedScore?: string }>>(new Map());

  const ethersProvider = useEthersProvider({ chainId });
  const ethersSigner = useEthersSigner({ chainId });
  
  // For local Hardhat network, create a direct provider to avoid wallet provider issues
  const directProvider = useMemo(() => {
    if (chainId === 31337) {
      return new ethers.JsonRpcProvider("http://localhost:8545", {
        chainId: 31337,
        name: "Hardhat Local",
      });
    }
    return ethersProvider;
  }, [chainId, ethersProvider]);

  // Get EIP1193 provider
  const eip1193Provider = useMemo(() => {
    if (chainId === 31337) {
      return "http://localhost:8545";
    }
    if (walletClient?.transport) {
      const transport = walletClient.transport as any;
      if (transport.value && typeof transport.value.request === "function") {
        return transport.value;
      }
      if (typeof transport.request === "function") {
        return transport;
      }
    }
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return undefined;
  }, [chainId, walletClient]);

  // FHEVM instance
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider: eip1193Provider,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected && !!eip1193Provider,
  });

  const contractAddress = useMemo(() => getContractAddressByChainId(chainId), [chainId]);

  const isDeployed = useMemo(() => {
    return Boolean(contractAddress && contractAddress !== ethers.ZeroAddress);
  }, [contractAddress]);

  // Load grades - defined before submitGrade to avoid circular dependency
  const loadGrades = useCallback(async () => {
    if (!contractAddress || !directProvider || !address) {
      return;
    }

    try {
      setIsLoading(true);
      setMessage("Loading grades...");

      // Check if contract exists at the address
      console.log("[loadGrades] Checking contract at address:", contractAddress, "chainId:", chainId);
      const code = await directProvider.getCode(contractAddress);
      console.log("[loadGrades] Contract code length:", code?.length || 0, "code preview:", code?.substring(0, 20) || "empty");
      if (code === "0x" || code === "0x0" || !code || code.length < 10) {
        console.warn("[loadGrades] No contract found at address:", contractAddress);
        // Try to load anyway - maybe the contract was just deployed and needs a moment
        // But first, wait a bit for the contract to be available
        await new Promise(resolve => setTimeout(resolve, 500));
        const codeRetry = await directProvider.getCode(contractAddress);
        if (codeRetry === "0x" || codeRetry === "0x0" || !codeRetry || codeRetry.length < 10) {
          console.warn("[loadGrades] Contract still not found after retry");
          setMessage("Contract not deployed at this address");
          setIsLoading(false);
          return;
        }
      }

      const contract = new ethers.Contract(
        contractAddress,
        EncryptedGradeRecordABI,
        directProvider
      ) as unknown as EncryptedGradeRecord;

      console.log("[loadGrades] Calling getStudentEntries for address:", address);
      const entryIds = await contract.getStudentEntries(address);
      console.log("[loadGrades] Received entryIds:", entryIds?.length || 0, entryIds);

      // Load all entries
      const gradeEntries: GradeEntry[] = [];
      for (const entryId of entryIds) {
        const entry = await contract.getEntry(entryId);
        if (entry.isActive) {
          const entryIdStr = entryId.toString();
          // Get preserved decrypted score from ref
          const preserved = decryptedScoresRef.current.get(entryIdStr);
          
          gradeEntries.push({
            id: entryId,
            subject: entry.subject,
            timestamp: entry.timestamp,
            isActive: entry.isActive,
            decryptedScore: preserved?.decryptedScore,
            encryptedScore: preserved?.encryptedScore,
          });
        }
      }

      console.log("[loadGrades] Loaded grades with preserved decrypted scores:", 
        gradeEntries.map(g => ({
          id: g.id.toString(),
          subject: g.subject,
          decryptedScore: g.decryptedScore,
        }))
      );

      setGrades(gradeEntries);
      setMessage("Grades loaded successfully");
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to load grades";
      // Suppress "could not decode result data" errors if contract doesn't exist
      if (errorMsg.includes("could not decode result data") || errorMsg.includes("BAD_DATA")) {
        console.warn("[loadGrades] Contract may not be deployed or method call failed:", errorMsg);
        setMessage("Contract not available. Please deploy the contract first.");
      } else {
        setMessage(`Load failed: ${errorMsg}`);
        console.error("[loadGrades] Error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, directProvider, address]);

  // Submit grade
  const submitGrade = useCallback(
    async (subject: string, score: number) => {
      console.log("[submitGrade] Starting submission:", { subject, score, contractAddress, hasSigner: !!ethersSigner, hasFhevm: !!fhevmInstance, address });
      
      if (!contractAddress || !ethersSigner || !fhevmInstance || !address) {
        const missing = [];
        if (!contractAddress) missing.push("contractAddress");
        if (!ethersSigner) missing.push("ethersSigner");
        if (!fhevmInstance) missing.push("fhevmInstance");
        if (!address) missing.push("address");
        console.error("[submitGrade] Missing requirements:", missing);
        setMessage(`Missing requirements: ${missing.join(", ")}`);
        return;
      }

      if (score < 0 || score > 100) {
        setMessage("Score must be between 0 and 100");
        return;
      }

      try {
        setIsSubmitting(true);
        setMessage("Encrypting score...");

        console.log("[submitGrade] Creating encrypted input...");
        // Encrypt score using FHEVM
        const encryptedInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedInput.add32(score);
        console.log("[submitGrade] Encrypting...");
        const encrypted = await encryptedInput.encrypt();
        console.log("[submitGrade] Encryption completed:", {
          handlesCount: encrypted.handles?.length,
          hasInputProof: !!encrypted.inputProof,
        });

        // Convert handle to hex string
        let handleHex: string;
        if (typeof encrypted.handles[0] === 'string') {
          handleHex = encrypted.handles[0];
        } else {
          handleHex = ethers.hexlify(encrypted.handles[0]);
          if (handleHex.length < 66) {
            const padded = handleHex.slice(2).padStart(64, '0');
            handleHex = `0x${padded}`;
          } else if (handleHex.length > 66) {
            handleHex = handleHex.slice(0, 66);
          }
        }

        // Convert inputProof to hex
        let inputProofHex: string;
        if (typeof encrypted.inputProof === 'string') {
          inputProofHex = encrypted.inputProof;
        } else {
          inputProofHex = ethers.hexlify(encrypted.inputProof);
        }

        setMessage("Submitting to contract...");
        console.log("[submitGrade] Submitting to contract:", {
          contractAddress,
          handleHex: handleHex.substring(0, 20) + "...",
          inputProofHex: inputProofHex.substring(0, 20) + "...",
          subject,
        });

        const contract = new ethers.Contract(
          contractAddress,
          EncryptedGradeRecordABI,
          ethersSigner
        ) as unknown as EncryptedGradeRecord;

        console.log("[submitGrade] Calling submitGrade on contract...");
        const tx = await contract.submitGrade(handleHex, inputProofHex, subject);
        console.log("[submitGrade] Transaction sent:", tx.hash);
        setMessage("Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("[submitGrade] Transaction confirmed:", {
          hash: receipt.hash,
          status: receipt.status,
          blockNumber: receipt.blockNumber,
        });

        if (!receipt || receipt.status !== 1) {
          throw new Error("Transaction failed");
        }

        setMessage("Grade submitted successfully!");
        console.log("[submitGrade] Grade submitted successfully, reloading grades...");
        
        // Reload grades after successful submission
        await loadGrades();
        console.log("[submitGrade] Grades reloaded");
      } catch (error: any) {
        const errorMsg = error?.message || "Failed to submit grade";
        setMessage(`Submit failed: ${errorMsg}`);
        console.error("[submitGrade] Error:", error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, chainId, loadGrades]
  );

  // Decrypt grade
  const decryptGrade = useCallback(
    async (entryId: bigint) => {
      if (!contractAddress || !ethersSigner || !fhevmInstance || !address) {
        setMessage("Missing requirements for decryption");
        console.error("[decryptGrade] Missing requirements:", {
          contractAddress: !!contractAddress,
          ethersSigner: !!ethersSigner,
          fhevmInstance: !!fhevmInstance,
          address: !!address,
        });
        return;
      }

      try {
        setGrades((prev) =>
          prev.map((g) => (g.id === entryId ? { ...g, isDecrypting: true } : g))
        );
        setMessage("Decrypting grade...");

        const contract = new ethers.Contract(
          contractAddress,
          EncryptedGradeRecordABI,
          directProvider
        ) as unknown as EncryptedGradeRecord;

        console.log("[decryptGrade] Fetching encrypted score for entryId:", entryId.toString());
        const encryptedScore = await contract.getEncryptedScore(entryId);
        console.log("[decryptGrade] Encrypted score received:", encryptedScore);

        // Convert euint32 to handle string
        let handle: string;
        if (typeof encryptedScore === "string") {
          handle = encryptedScore;
        } else if (typeof encryptedScore === "bigint" || typeof encryptedScore === "number") {
          handle = ethers.hexlify(encryptedScore);
        } else {
          // Try to convert bytes32 or other format
          handle = ethers.hexlify(encryptedScore);
        }

        // Ensure handle is 66 characters (0x + 64 hex chars)
        if (handle.length < 66) {
          const padded = handle.slice(2).padStart(64, "0");
          handle = `0x${padded}`;
        } else if (handle.length > 66) {
          handle = handle.slice(0, 66);
        }

        console.log("[decryptGrade] Handle formatted:", handle);

        if (!handle || handle === "0x" || handle.length !== 66) {
          throw new Error(`Invalid handle format: ${handle}. Expected 66 characters`);
        }

        // Get decryption signature
        console.log("[decryptGrade] Loading decryption signature...");
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            fhevmInstance,
            [contractAddress as `0x${string}`],
            ethersSigner,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          throw new Error("Unable to build FHEVM decryption signature");
        }

        console.log("[decryptGrade] Decryption signature obtained, starting decryption...");

        // Decrypt
        const decryptedResult = await fhevmInstance.userDecrypt(
          [{ handle, contractAddress: contractAddress as `0x${string}` }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        console.log("[decryptGrade] Decryption result:", decryptedResult);

        const decryptedValue = decryptedResult[handle];
        if (decryptedValue === undefined) {
          throw new Error(`Decryption failed: No value returned for handle ${handle}`);
        }

        const decryptedScore = typeof decryptedValue === "bigint" 
          ? Number(decryptedValue) 
          : Number(decryptedValue);

        console.log("[decryptGrade] Decrypted score:", decryptedScore);
        console.log("[decryptGrade] EntryId:", entryId.toString());

        // Save decrypted score to ref for persistence across reloads
        const entryIdStr = entryId.toString();
        decryptedScoresRef.current.set(entryIdStr, {
          decryptedScore,
          encryptedScore: handle,
        });
        console.log("[decryptGrade] Saved to ref:", entryIdStr, decryptedScore);

        // Update grades state with decrypted score
        // Use functional update to ensure we get the latest state
        setGrades((prev) => {
          console.log("[decryptGrade] Updating grades, current count:", prev.length);
          const entryIdStr = entryId.toString();
          
          // Create a completely new array to ensure React detects the change
          const updated = prev.map((g) => {
            const gIdStr = g.id.toString();
            const isMatch = gIdStr === entryIdStr;
            
            if (isMatch) {
              console.log("[decryptGrade] Found matching grade:", {
                id: gIdStr,
                subject: g.subject,
                oldDecryptedScore: g.decryptedScore,
                newDecryptedScore: decryptedScore,
              });
              // Create a completely new object to ensure React detects the change
              return { 
                id: g.id,
                subject: g.subject,
                timestamp: g.timestamp,
                isActive: g.isActive,
                decryptedScore, 
                isDecrypting: false, 
                encryptedScore: handle 
              };
            }
            // Return a new object for non-matching entries too
            return { 
              id: g.id,
              subject: g.subject,
              timestamp: g.timestamp,
              isActive: g.isActive,
              decryptedScore: g.decryptedScore,
              isDecrypting: false,
              encryptedScore: g.encryptedScore,
            };
          });
          
          const updatedGradesInfo = updated.map(g => ({
            id: g.id.toString(),
            subject: g.subject,
            hasDecryptedScore: g.decryptedScore !== undefined,
            decryptedScore: g.decryptedScore,
            isDecrypting: g.isDecrypting,
          }));
          console.log("[decryptGrade] Updated grades:", JSON.stringify(updatedGradesInfo, null, 2));
          console.log("[decryptGrade] Returning updated grades array with length:", updated.length);
          
          // Verify the update
          const updatedGrade = updated.find(g => g.id.toString() === entryIdStr);
          if (updatedGrade) {
            console.log("[decryptGrade] Verified updated grade:", {
              id: updatedGrade.id.toString(),
              decryptedScore: updatedGrade.decryptedScore,
              isDecrypted: updatedGrade.decryptedScore !== undefined,
            });
          }
          
          // Return a new array reference to ensure React detects the change
          return [...updated];
        });
        
        // Use flushSync to force immediate state update (if available)
        // Otherwise, use a small delay to ensure state is processed
        await new Promise(resolve => {
          // Use requestAnimationFrame to ensure state update is processed
          requestAnimationFrame(() => {
            setTimeout(resolve, 0);
          });
        });

        setMessage("Decryption completed!");
      } catch (error: any) {
        const errorMsg = error?.message || "Failed to decrypt grade";
        setMessage(`Decryption failed: ${errorMsg}`);
        setGrades((prev) =>
          prev.map((g) => (g.id === entryId ? { ...g, isDecrypting: false } : g))
        );
        console.error("[decryptGrade] Error:", error);
        console.error("[decryptGrade] Error stack:", error?.stack);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, directProvider, fhevmDecryptionSignatureStorage]
  );

  // Request student stats
  const requestStudentStats = useCallback(async () => {
    if (!contractAddress || !ethersSigner || !address) {
      setMessage("Missing requirements");
      return;
    }

    try {
      setMessage("Requesting student statistics...");
      const contract = new ethers.Contract(
        contractAddress,
        EncryptedGradeRecordABI,
        ethersSigner
      ) as unknown as EncryptedGradeRecord;

      await contract.requestStudentStats(address);
      setMessage("Statistics request submitted. Waiting for decryption...");
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to request stats";
      setMessage(`Request failed: ${errorMsg}`);
      console.error("[requestStudentStats] Error:", error);
    }
  }, [contractAddress, ethersSigner, address]);

  // Load student stats
  const loadStudentStats = useCallback(async () => {
    if (!contractAddress || !directProvider || !address) {
      return;
    }

    try {
      // Check if contract exists
      const code = await directProvider.getCode(contractAddress);
      if (code === "0x" || code === "0x0") {
        return;
      }

      const contract = new ethers.Contract(
        contractAddress,
        EncryptedGradeRecordABI,
        directProvider
      ) as unknown as EncryptedGradeRecord;

      const isFinalized = await contract.isStudentStatsFinalized(address);
      if (isFinalized) {
        const stats = await contract.getStudentStats(address);
        setStudentAverage(Number(stats.averageScore));
      }
    } catch (error: any) {
      // Suppress "could not decode result data" errors
      if (!error?.message?.includes("could not decode result data") && !error?.message?.includes("BAD_DATA")) {
        console.error("[loadStudentStats] Error:", error);
      }
    }
  }, [contractAddress, directProvider, address]);

  // Request global stats
  const requestGlobalStats = useCallback(async () => {
    if (!contractAddress || !ethersSigner) {
      setMessage("Missing requirements");
      return;
    }

    try {
      setMessage("Requesting global statistics...");
      const contract = new ethers.Contract(
        contractAddress,
        EncryptedGradeRecordABI,
        ethersSigner
      ) as unknown as EncryptedGradeRecord;

      await contract.requestGlobalStats();
      setMessage("Global statistics request submitted. Waiting for decryption...");
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to request global stats";
      setMessage(`Request failed: ${errorMsg}`);
      console.error("[requestGlobalStats] Error:", error);
    }
  }, [contractAddress, ethersSigner]);

  // Load global stats
  const loadGlobalStats = useCallback(async () => {
    if (!contractAddress || !directProvider) {
      return;
    }

    try {
      // Check if contract exists
      const code = await directProvider.getCode(contractAddress);
      if (code === "0x" || code === "0x0") {
        return;
      }

      const contract = new ethers.Contract(
        contractAddress,
        EncryptedGradeRecordABI,
        directProvider
      ) as unknown as EncryptedGradeRecord;

      const isFinalized = await contract.isGlobalStatsFinalized();
      if (isFinalized) {
        const stats = await contract.getGlobalStats();
        setGlobalAverage(Number(stats.averageScore));
      }
    } catch (error: any) {
      // Suppress "could not decode result data" errors
      if (!error?.message?.includes("could not decode result data") && !error?.message?.includes("BAD_DATA")) {
        console.error("[loadGlobalStats] Error:", error);
      }
    }
  }, [contractAddress, directProvider]);

  // Auto-load grades when connected
  useEffect(() => {
    if (isConnected && isDeployed && address) {
      loadGrades();
      loadStudentStats();
      loadGlobalStats();
    }
  }, [isConnected, isDeployed, address, loadGrades, loadStudentStats, loadGlobalStats]);

  return {
    contractAddress,
    grades,
    isLoading,
    isSubmitting,
    message,
    studentAverage,
    globalAverage,
    isDeployed,
    fhevmStatus,
    fhevmError,
    submitGrade,
    loadGrades,
    decryptGrade,
    requestStudentStats,
    loadStudentStats,
    requestGlobalStats,
    loadGlobalStats,
  };
};

