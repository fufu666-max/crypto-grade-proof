import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptedGradeRecord, EncryptedGradeRecord__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedGradeRecord")) as EncryptedGradeRecord__factory;
  const gradeRecordContract = (await factory.deploy()) as EncryptedGradeRecord;
  const gradeRecordContractAddress = await gradeRecordContract.getAddress();

  return { gradeRecordContract, gradeRecordContractAddress };
}

describe("EncryptedGradeRecord", function () {
  let signers: Signers;
  let gradeRecordContract: EncryptedGradeRecord;
  let gradeRecordContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ gradeRecordContract, gradeRecordContractAddress } = await deployFixture());
  });

  it("should have zero entries after deployment", async function () {
    const entryCount = await gradeRecordContract.getEntryCount();
    expect(entryCount).to.eq(0);
  });

  it("should submit a grade entry", async function () {
    const clearScore = 85;
    const encryptedScore = await fhevm
      .createEncryptedInput(gradeRecordContractAddress, signers.alice.address)
      .add32(clearScore)
      .encrypt();

    const tx = await gradeRecordContract
      .connect(signers.alice)
      .submitGrade(encryptedScore.handles[0], encryptedScore.inputProof, "Mathematics");
    await tx.wait();

    const entryCount = await gradeRecordContract.getEntryCount();
    expect(entryCount).to.eq(1);

    const studentEntryCount = await gradeRecordContract.getStudentEntryCount(signers.alice.address);
    expect(studentEntryCount).to.eq(1);

    const entry = await gradeRecordContract.getEntry(0);
    expect(entry.student).to.eq(signers.alice.address);
    expect(entry.subject).to.eq("Mathematics");
    expect(entry.isActive).to.eq(true);
  });

  it("should submit multiple grade entries for the same student", async function () {
    // Submit first grade
    const clearScore1 = 85;
    const encryptedScore1 = await fhevm
      .createEncryptedInput(gradeRecordContractAddress, signers.alice.address)
      .add32(clearScore1)
      .encrypt();

    let tx = await gradeRecordContract
      .connect(signers.alice)
      .submitGrade(encryptedScore1.handles[0], encryptedScore1.inputProof, "Mathematics");
    await tx.wait();

    // Submit second grade
    const clearScore2 = 90;
    const encryptedScore2 = await fhevm
      .createEncryptedInput(gradeRecordContractAddress, signers.alice.address)
      .add32(clearScore2)
      .encrypt();

    tx = await gradeRecordContract
      .connect(signers.alice)
      .submitGrade(encryptedScore2.handles[0], encryptedScore2.inputProof, "Physics");
    await tx.wait();

    const studentEntryCount = await gradeRecordContract.getStudentEntryCount(signers.alice.address);
    expect(studentEntryCount).to.eq(2);

    const entryCount = await gradeRecordContract.getEntryCount();
    expect(entryCount).to.eq(2);
  });

  it("should get encrypted student stats", async function () {
    const clearScore1 = 80;
    const encryptedScore1 = await fhevm
      .createEncryptedInput(gradeRecordContractAddress, signers.alice.address)
      .add32(clearScore1)
      .encrypt();

    let tx = await gradeRecordContract
      .connect(signers.alice)
      .submitGrade(encryptedScore1.handles[0], encryptedScore1.inputProof, "Mathematics");
    await tx.wait();

    const clearScore2 = 90;
    const encryptedScore2 = await fhevm
      .createEncryptedInput(gradeRecordContractAddress, signers.alice.address)
      .add32(clearScore2)
      .encrypt();

    tx = await gradeRecordContract
      .connect(signers.alice)
      .submitGrade(encryptedScore2.handles[0], encryptedScore2.inputProof, "Physics");
    await tx.wait();

    const [encryptedSum, count] = await gradeRecordContract.getEncryptedStudentStats(signers.alice.address);
    expect(count).to.eq(2);

    // Decrypt the sum to verify
    const clearSum = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSum,
      gradeRecordContractAddress,
      signers.alice,
    );
    expect(clearSum).to.eq(clearScore1 + clearScore2);
  });

  it("should delete a grade entry", async function () {
    const clearScore = 85;
    const encryptedScore = await fhevm
      .createEncryptedInput(gradeRecordContractAddress, signers.alice.address)
      .add32(clearScore)
      .encrypt();

    let tx = await gradeRecordContract
      .connect(signers.alice)
      .submitGrade(encryptedScore.handles[0], encryptedScore.inputProof, "Mathematics");
    await tx.wait();

    let studentEntryCount = await gradeRecordContract.getStudentEntryCount(signers.alice.address);
    expect(studentEntryCount).to.eq(1);

    tx = await gradeRecordContract.connect(signers.alice).deleteGrade(0);
    await tx.wait();

    studentEntryCount = await gradeRecordContract.getStudentEntryCount(signers.alice.address);
    expect(studentEntryCount).to.eq(0);

    const entry = await gradeRecordContract.getEntry(0);
    expect(entry.isActive).to.eq(false);
  });

  it("should prevent unauthorized deletion", async function () {
    const clearScore = 85;
    const encryptedScore = await fhevm
      .createEncryptedInput(gradeRecordContractAddress, signers.alice.address)
      .add32(clearScore)
      .encrypt();

    const tx = await gradeRecordContract
      .connect(signers.alice)
      .submitGrade(encryptedScore.handles[0], encryptedScore.inputProof, "Mathematics");
    await tx.wait();

    await expect(
      gradeRecordContract.connect(signers.bob).deleteGrade(0)
    ).to.be.revertedWith("Not authorized");
  });

  it("should get encrypted global stats", async function () {
    // Alice submits a grade
    const clearScore1 = 80;
    const encryptedScore1 = await fhevm
      .createEncryptedInput(gradeRecordContractAddress, signers.alice.address)
      .add32(clearScore1)
      .encrypt();

    let tx = await gradeRecordContract
      .connect(signers.alice)
      .submitGrade(encryptedScore1.handles[0], encryptedScore1.inputProof, "Mathematics");
    await tx.wait();

    // Bob submits a grade
    const clearScore2 = 90;
    const encryptedScore2 = await fhevm
      .createEncryptedInput(gradeRecordContractAddress, signers.bob.address)
      .add32(clearScore2)
      .encrypt();

    tx = await gradeRecordContract
      .connect(signers.bob)
      .submitGrade(encryptedScore2.handles[0], encryptedScore2.inputProof, "Physics");
    await tx.wait();

    const [encryptedSum, count] = await gradeRecordContract.getEncryptedGlobalStats();
    expect(count).to.eq(2);

    // Decrypt the sum to verify (using alice's key, but global sum should be decryptable by anyone with permission)
    // Note: In a real scenario, global stats would need special permissions for decryption
    const clearSum = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSum,
      gradeRecordContractAddress,
      signers.alice,
    );
    expect(clearSum).to.eq(clearScore1 + clearScore2);
  });
});

