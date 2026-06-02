// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/PolicyRegistry.sol";
import "../src/SecurityReportRegistry.sol";

contract Deploy {
    function run() external returns (SecurityReportRegistry, PolicyRegistry) {
        SecurityReportRegistry reportRegistry = new SecurityReportRegistry();
        PolicyRegistry policyRegistry = new PolicyRegistry();

        return (reportRegistry, policyRegistry);
    }
}
