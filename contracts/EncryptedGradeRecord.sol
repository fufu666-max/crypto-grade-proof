// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedGradeRecord - Privacy-Preserving Grade Management System
/// @notice Students can submit encrypted exam scores. FHE computes average scores and growth trends.
/// @dev Only students can decrypt their own scores. Schools can only view aggregated statistics.
contract EncryptedGradeRecord is SepoliaConfig {
    struct GradeEntry {
        address student;
        string subject;
        euint32 encryptedScore; // Encrypted score (0-100)
        uint256 timestamp;
        bool isActive;
    }

    // Grade entry storage
    mapping(uint256 => GradeEntry) public gradeEntries;
    uint256 public entryCount;

    // Student management
    mapping(address => uint256[]) public studentEntries; // Student's entry IDs
    mapping(address => uint256) public studentEntryCount; // Total entries per student

    // Encrypted aggregate data per student
    mapping(address => euint32) private _encryptedStudentSum; // Encrypted sum of student's scores
    mapping(address => uint32) private _studentEntryCount; // Entry count per student

    // Encrypted global statistics (for school view)
    euint32 private _encryptedGlobalSum; // Encrypted sum of all scores
    uint32 private _globalEntryCount; // Total active entry count

    // Decrypted statistics (only available after decryption request)
    mapping(address => uint32) private _decryptedStudentAverage; // Student's average score
    mapping(address => bool) private _studentStatsFinalized; // Are student stats decrypted
    mapping(uint256 => address) private _studentStatsRequest; // Track student stats requests

    uint32 private _decryptedGlobalAverage; // Decrypted global average score
    bool private _globalStatsFinalized; // Are global stats decrypted
    mapping(uint256 => bool) private _globalStatsRequest; // Track global stats requests

    // Events
    event GradeSubmitted(uint256 indexed entryId, address indexed student, string subject, uint256 timestamp);
    event GradeDeleted(uint256 indexed entryId, address indexed student);
    event StudentStatsRequested(address indexed student, uint256 requestId);
    event StudentStatsPublished(address indexed student, uint32 averageScore, uint32 count);
    event GlobalStatsRequested(uint256 requestId);
    event GlobalStatsPublished(uint32 averageScore, uint32 totalCount);

    /// @notice Submit a new grade entry
    /// @param encryptedScore Encrypted score value (0-100)
    /// @param inputProof Input proof for encrypted score
    /// @param subject Subject name (e.g., "Mathematics", "Physics")
    function submitGrade(
        externalEuint32 encryptedScore,
        bytes calldata inputProof,
        string memory subject
    ) external {
        require(bytes(subject).length > 0, "Subject cannot be empty");
        require(bytes(subject).length <= 100, "Subject too long");

        euint32 score = FHE.fromExternal(encryptedScore, inputProof);

        uint256 entryId = entryCount++;
        gradeEntries[entryId] = GradeEntry({
            student: msg.sender,
            subject: subject,
            encryptedScore: score,
            timestamp: block.timestamp,
            isActive: true
        });

        // Update student's entry list
        studentEntries[msg.sender].push(entryId);
        studentEntryCount[msg.sender]++;

        // Update student aggregate data
        if (_studentEntryCount[msg.sender] == 0) {
            _encryptedStudentSum[msg.sender] = score;
        } else {
            _encryptedStudentSum[msg.sender] = FHE.add(_encryptedStudentSum[msg.sender], score);
        }
        _studentEntryCount[msg.sender]++;

        // Update global statistics
        if (_globalEntryCount == 0) {
            _encryptedGlobalSum = score;
        } else {
            _encryptedGlobalSum = FHE.add(_encryptedGlobalSum, score);
        }
        _globalEntryCount++;

        // Set permissions
        FHE.allowThis(score);
        FHE.allow(score, msg.sender);
        FHE.allowThis(_encryptedStudentSum[msg.sender]);
        FHE.allow(_encryptedStudentSum[msg.sender], msg.sender);
        FHE.allowThis(_encryptedGlobalSum);

        emit GradeSubmitted(entryId, msg.sender, subject, block.timestamp);
    }

    /// @notice Delete a grade entry (only callable by the student who submitted it)
    /// @param entryId Entry ID to delete
    function deleteGrade(uint256 entryId) external {
        require(entryId < entryCount, "Entry does not exist");
        GradeEntry storage entry = gradeEntries[entryId];
        require(entry.student == msg.sender, "Not authorized");
        require(entry.isActive, "Entry already deleted");

        // Remove from student aggregate data
        _encryptedStudentSum[msg.sender] = FHE.sub(_encryptedStudentSum[msg.sender], entry.encryptedScore);
        _studentEntryCount[msg.sender]--;
        studentEntryCount[msg.sender]--;

        // Remove from global statistics
        _encryptedGlobalSum = FHE.sub(_encryptedGlobalSum, entry.encryptedScore);
        _globalEntryCount--;

        entry.isActive = false;

        // Update permissions
        FHE.allowThis(_encryptedStudentSum[msg.sender]);
        FHE.allow(_encryptedStudentSum[msg.sender], msg.sender);
        FHE.allowThis(_encryptedGlobalSum);

        emit GradeDeleted(entryId, msg.sender);
    }

    /// @notice Get grade entry information
    /// @param entryId Entry ID
    /// @return student Student address
    /// @return subject Subject name
    /// @return timestamp Submission timestamp
    /// @return isActive Active status
    function getEntry(uint256 entryId) external view returns (
        address student,
        string memory subject,
        uint256 timestamp,
        bool isActive
    ) {
        GradeEntry storage entry = gradeEntries[entryId];
        return (entry.student, entry.subject, entry.timestamp, entry.isActive);
    }

    /// @notice Get entry's encrypted score (only accessible by student and contract)
    /// @param entryId Entry ID
    /// @return Encrypted score value
    function getEncryptedScore(uint256 entryId) external view returns (euint32) {
        require(entryId < entryCount, "Entry does not exist");
        return gradeEntries[entryId].encryptedScore;
    }

    /// @notice Get student's entry IDs
    /// @param student Student address
    /// @return Array of entry IDs
    function getStudentEntries(address student) external view returns (uint256[] memory) {
        return studentEntries[student];
    }

    /// @notice Get encrypted statistics for a specific student
    /// @param student Student address
    /// @return encryptedSum Encrypted sum of student's scores
    /// @return count Entry count for this student
    function getEncryptedStudentStats(address student) external view returns (euint32 encryptedSum, uint32 count) {
        return (_encryptedStudentSum[student], _studentEntryCount[student]);
    }

    /// @notice Get encrypted global statistics (for school view)
    /// @return encryptedSum Encrypted sum of all scores
    /// @return count Total active entry count
    function getEncryptedGlobalStats() external view returns (euint32 encryptedSum, uint32 count) {
        return (_encryptedGlobalSum, _globalEntryCount);
    }

    /// @notice Request decryption of student-specific statistics
    /// @param student Student address (must be msg.sender)
    function requestStudentStats(address student) external {
        require(student == msg.sender, "Can only request own stats");
        require(_studentEntryCount[student] > 0, "No data for this student");
        require(!_studentStatsFinalized[student], "Student stats already finalized");

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(_encryptedStudentSum[student]);

        uint256 requestId = FHE.requestDecryption(cts, this.studentStatsCallback.selector);
        _studentStatsRequest[requestId] = student;

        emit StudentStatsRequested(student, requestId);
    }

    /// @notice Callback function for student statistics decryption
    function studentStatsCallback(uint256 requestId, bytes memory cleartexts, bytes[] memory /*signatures*/) public returns (bool) {
        address student = _studentStatsRequest[requestId];
        require(student != address(0), "Invalid request");
        require(!_studentStatsFinalized[student], "Already finalized");
        require(_studentEntryCount[student] > 0, "No data");

        uint32 totalScore;
        require(cleartexts.length >= 4, "Invalid cleartext length");
        assembly {
            totalScore := shr(224, mload(add(cleartexts, 32)))
        }

        uint32 count = _studentEntryCount[student];
        _decryptedStudentAverage[student] = count > 0 ? totalScore / count : 0;

        _studentStatsFinalized[student] = true;
        delete _studentStatsRequest[requestId];

        emit StudentStatsPublished(student, _decryptedStudentAverage[student], count);
        return true;
    }

    /// @notice Request decryption of global statistics (for school view)
    function requestGlobalStats() external {
        require(_globalEntryCount > 0, "No data to decrypt");
        require(!_globalStatsFinalized, "Global stats already finalized");

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(_encryptedGlobalSum);

        uint256 requestId = FHE.requestDecryption(cts, this.globalStatsCallback.selector);
        _globalStatsRequest[requestId] = true;

        emit GlobalStatsRequested(requestId);
    }

    /// @notice Callback function for global statistics decryption
    function globalStatsCallback(uint256 requestId, bytes memory cleartexts, bytes[] memory /*signatures*/) public returns (bool) {
        require(_globalStatsRequest[requestId], "Invalid request");
        require(!_globalStatsFinalized, "Already finalized");
        require(_globalEntryCount > 0, "No active entries");

        uint32 totalScore;
        require(cleartexts.length >= 4, "Invalid cleartext length");
        assembly {
            totalScore := shr(224, mload(add(cleartexts, 32)))
        }

        _decryptedGlobalAverage = _globalEntryCount > 0 ? totalScore / _globalEntryCount : 0;

        _globalStatsFinalized = true;
        delete _globalStatsRequest[requestId];

        emit GlobalStatsPublished(_decryptedGlobalAverage, _globalEntryCount);
        return true;
    }

    /// @notice Check if student statistics are available
    /// @param student Student address
    /// @return Whether student statistics have been decrypted
    function isStudentStatsFinalized(address student) external view returns (bool) {
        return _studentStatsFinalized[student];
    }

    /// @notice Get decrypted student statistics (only available after finalization)
    /// @param student Student address
    /// @return averageScore Average score for this student
    /// @return count Entry count for this student
    function getStudentStats(address student) external view returns (uint32 averageScore, uint32 count) {
        require(_studentStatsFinalized[student], "Student stats not available yet");
        return (_decryptedStudentAverage[student], _studentEntryCount[student]);
    }

    /// @notice Check if global statistics are available
    /// @return Whether global statistics have been decrypted
    function isGlobalStatsFinalized() external view returns (bool) {
        return _globalStatsFinalized;
    }

    /// @notice Get decrypted global statistics (only available after finalization)
    /// @return averageScore Global average score
    /// @return totalCount Total active entry count
    function getGlobalStats() external view returns (uint32 averageScore, uint32 totalCount) {
        require(_globalStatsFinalized, "Global stats not available yet");
        return (_decryptedGlobalAverage, _globalEntryCount);
    }

    /// @notice Get total entry count
    /// @return Total entry count
    function getEntryCount() external view returns (uint256) {
        return entryCount;
    }

    /// @notice Get student's entry count
    /// @param student Student address
    /// @return Entry count for this student
    function getStudentEntryCount(address student) external view returns (uint256) {
        return studentEntryCount[student];
    }
}

