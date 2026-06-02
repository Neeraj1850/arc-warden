// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PolicyRegistry {
    address public owner;

    struct Policy {
        bool enabled;
        string uri;
        uint256 updatedAt;
    }

    mapping(bytes32 => Policy) public policies;

    event PolicyUpdated(bytes32 indexed policyId, bool enabled, string uri);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setPolicy(bytes32 policyId, bool enabled, string calldata uri) external onlyOwner {
        require(policyId != bytes32(0), "POLICY_ID_REQUIRED");

        policies[policyId] = Policy({
            enabled: enabled,
            uri: uri,
            updatedAt: block.timestamp
        });

        emit PolicyUpdated(policyId, enabled, uri);
    }
}
