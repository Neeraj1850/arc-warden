// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/PolicyRegistry.sol";

contract PolicyRegistryTest {
    function testSetPolicy() external {
        PolicyRegistry registry = new PolicyRegistry();
        bytes32 policyId = keccak256("block-unlimited-approval");

        registry.setPolicy(policyId, true, "ipfs://policy");

        (bool enabled, string memory uri, uint256 updatedAt) = registry.policies(policyId);
        require(enabled, "policy should be enabled");
        require(bytes(uri).length > 0, "policy uri should be set");
        require(updatedAt > 0, "policy timestamp should be set");
    }
}
