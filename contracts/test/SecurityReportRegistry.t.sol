// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/SecurityReportRegistry.sol";

contract SecurityReportRegistryTest {
    function testSubmitReport() external {
        SecurityReportRegistry registry = new SecurityReportRegistry();
        bytes32 reportHash = keccak256("report");

        registry.submitReport(
            reportHash,
            SecurityReportRegistry.Verdict.BLOCK,
            95,
            "ipfs://report"
        );

        require(registry.reportExists(reportHash), "report should exist");
    }

    function testRejectRiskScoreAboveOneHundred() external {
        SecurityReportRegistry registry = new SecurityReportRegistry();

        try registry.submitReport(
            keccak256("report"),
            SecurityReportRegistry.Verdict.WARN,
            101,
            ""
        ) {
            revert("expected revert");
        } catch {}
    }
}
