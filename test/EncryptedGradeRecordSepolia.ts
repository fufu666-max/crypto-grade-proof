import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { EncryptedGradeRecord } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EncryptedGradeRecordSepolia", function () {
  let signers: Signers;
  let gradeRecordContract: EncryptedGradeRecord;
  let gradeRecordContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const EncryptedGradeRecordDeployment = await deployments.get("EncryptedGradeRecord");
      gradeRecordContractAddress = EncryptedGradeRecordDeployment.address;
      gradeRecordContract = await ethers.getContractAt("EncryptedGradeRecord", EncryptedGradeRecordDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should submit a grade entry", async function () {
    steps = 8;

    this.timeout(4 * 40000);

    progress("Encrypting score '85'...");
    const encryptedScore = await fhevm
      .createEncryptedInput(gradeRecordContractAddress, signers.alice.address)
      .add32(85)
      .encrypt();

    progress(
      `Call submitGrade() EncryptedGradeRecord=${gradeRecordContractAddress} handle=${ethers.hexlify(encryptedScore.handles[0])} signer=${signers.alice.address}...`,
    );
    const tx = await gradeRecordContract
      .connect(signers.alice)
      .submitGrade(encryptedScore.handles[0], encryptedScore.inputProof, "Mathematics");
    await tx.wait();

    progress(`Call getEntryCount()...`);
    const entryCount = await gradeRecordContract.getEntryCount();
    expect(entryCount).to.eq(1);

    progress(`Call getStudentEntryCount()...`);
    const studentEntryCount = await gradeRecordContract.getStudentEntryCount(signers.alice.address);
    expect(studentEntryCount).to.eq(1);

    progress(`Call getEntry(0)...`);
    const entry = await gradeRecordContract.getEntry(0);
    expect(entry.student).to.eq(signers.alice.address);
    expect(entry.subject).to.eq("Mathematics");
    expect(entry.isActive).to.eq(true);

    progress(`Call getEncryptedStudentStats()...`);
    const [encryptedSum, count] = await gradeRecordContract.getEncryptedStudentStats(signers.alice.address);
    expect(count).to.eq(1);

    progress(`Decrypting encryptedSum=${encryptedSum}...`);
    const clearSum = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSum,
      gradeRecordContractAddress,
      signers.alice,
    );
    progress(`Clear encryptedSum=${clearSum}`);
    expect(clearSum).to.eq(85);
  });
});

