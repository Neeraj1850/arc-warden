// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SecurityReportRegistry {
    enum Verdict {
        ALLOW,
        WARN,
        BLOCK
    }

    struct Report {
        address submitter;
        Verdict verdict;
        uint8 riskScore;
        string uri;
        uint256 createdAt;
    }

    mapping(bytes32 => Report) public reports;

    event ReportSubmitted(
        bytes32 indexed reportHash,
        address indexed submitter,
        Verdict verdict,
        uint8 riskScore,
        string uri
    );

    function submitReport(
        bytes32 reportHash,
        Verdict verdict,
        uint8 riskScore,
        string calldata uri
    ) external {
        require(reportHash != bytes32(0), "REPORT_HASH_REQUIRED");
        require(riskScore <= 100, "INVALID_RISK_SCORE");
        require(reports[reportHash].createdAt == 0, "REPORT_EXISTS");

        reports[reportHash] = Report({
            submitter: msg.sender,
            verdict: verdict,
            riskScore: riskScore,
            uri: uri,
            createdAt: block.timestamp
        });

        emit ReportSubmitted(reportHash, msg.sender, verdict, riskScore, uri);
    }

    function reportExists(bytes32 reportHash) external view returns (bool) {
        return reports[reportHash].createdAt != 0;
    }
}
