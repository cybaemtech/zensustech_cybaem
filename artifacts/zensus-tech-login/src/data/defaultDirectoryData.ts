export interface TenantUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  userType?: string;
  accountEnabled: boolean;
  createdDateTime?: string;
  roles?: string[];
  role?: string;
  mfaEnabled?: boolean | null;
  mfa?: string;
  status?: string;
  risk?: string;
}

export const DEFAULT_USERS: TenantUser[] = [
  {
    id: "4963ff19-c681-4a7e-a044-facb085add51",
    displayName: "Chaithra",
    userPrincipalName: "Chaithra@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-05-05T05:43:01Z",
    roles: ["Standard User"],
    role: "Standard User",
    mfaEnabled: false,
    mfa: "Disabled",
    status: "Active",
    risk: "Medium"
  },
  {
    id: "fecb0d9a-a656-4801-8341-79486d71bc77",
    displayName: "cybaem",
    userPrincipalName: "cybaem@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-09-30T04:49:12Z",
    roles: ["Global Reader"],
    role: "Global Reader",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "c7496808-c608-4f22-ba16-33eee3aa2bf6",
    displayName: "Microsoft",
    userPrincipalName: "Microsoft@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-02-07T06:24:22Z",
    roles: ["Standard User"],
    role: "Standard User",
    mfaEnabled: false,
    mfa: "Disabled",
    status: "Active",
    risk: "Medium"
  },
  {
    id: "7efa7da0-c474-4d00-8e8a-65617ce80ee0",
    displayName: "Prasad",
    userPrincipalName: "Prasad@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-06-05T15:20:57Z",
    roles: ["Standard User"],
    role: "Standard User",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "70a04944-77e8-42f0-94d8-cbbcc1f50117",
    displayName: "Sahil Bhosale",
    userPrincipalName: "Sahil.Bhosale@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-08-01T07:11:00Z",
    roles: ["Standard User"],
    role: "Standard User",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "c60bf8e3-0d34-4530-b384-a82f3ef7f9c2",
    displayName: "Sai",
    userPrincipalName: "Sai@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-07-12T11:45:00Z",
    roles: ["Standard User"],
    role: "Standard User",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "6f5cfb5a-4e67-463f-9146-5e04cb476cba",
    displayName: "Sales",
    userPrincipalName: "Sales@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-03-15T09:10:00Z",
    roles: ["Standard User"],
    role: "Standard User",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "6c2688cf-f3e0-4740-9da2-1d5e54d5b2c7",
    displayName: "Sandhya Patwardhan",
    userPrincipalName: "Sandhya.Patwardhan@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-05-18T14:22:00Z",
    roles: ["Standard User"],
    role: "Standard User",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "1c28c871-3e49-411a-be00-b88a91630138",
    displayName: "Shahnawaz Khan",
    userPrincipalName: "shahnawaz.khan@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-04-10T08:30:00Z",
    roles: ["Global Administrator"],
    role: "Global Administrator",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "ff4d4157-195c-43be-b94f-442878bfddae",
    displayName: "TestingApp",
    userPrincipalName: "TestingApp@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-09-01T12:00:00Z",
    roles: ["Standard User"],
    role: "Standard User",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "3c3c7e43-e65a-40a2-947b-7b0a708170c0",
    displayName: "Vinay",
    userPrincipalName: "Vinay@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-01-20T10:15:00Z",
    roles: ["Global Administrator"],
    role: "Global Administrator",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "976d8b67-4229-4d6b-b461-945ec6bc5b06",
    displayName: "Vinayak Salunkhe",
    userPrincipalName: "vinayak.salunkhe@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-01-15T08:00:00Z",
    roles: ["Global Administrator"],
    role: "Global Administrator",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "1feae98a-1695-46f4-a640-5e3698eaee91",
    displayName: "Vinayak Salunkhe",
    userPrincipalName: "vinayak.salunkhe@zensustech0.onmicrosoft.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-01-10T07:45:00Z",
    roles: ["Global Administrator"],
    role: "Global Administrator",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  },
  {
    id: "f8c8d8ae-a379-4503-a1a7-6813bf6936c5",
    displayName: "Vinil",
    userPrincipalName: "Vinil@zensustech.com",
    userType: "Member",
    accountEnabled: true,
    createdDateTime: "2026-07-25T13:35:00Z",
    roles: ["Security Administrator", "Global Administrator"],
    role: "Security Administrator",
    mfaEnabled: true,
    mfa: "Enabled",
    status: "Active",
    risk: "Low"
  }
];

export const DEFAULT_APPLICATIONS = [
  {
    id: "272b0561-26da-4ca6-b4d6-88c9df409ffc",
    appId: "c8e23f0a-1111-4444-8888-000000000001",
    displayName: "Test-App-Registration",
    createdDateTime: "2026-03-10T10:00:00Z",
    signInAudience: "AzureADMyOrg"
  },
  {
    id: "0d8a5732-cba1-4fc3-a185-bb9f1a277da2",
    appId: "c8e23f0a-2222-4444-8888-000000000002",
    displayName: "Zensustech",
    createdDateTime: "2026-01-15T09:30:00Z",
    signInAudience: "AzureADMyOrg"
  },
  {
    id: "e44dcfb6-1eb8-4d57-9db6-e9185a2109e6",
    appId: "c8e23f0a-3333-4444-8888-000000000003",
    displayName: "ZensusTechAI-Ops",
    createdDateTime: "2026-04-05T14:15:00Z",
    signInAudience: "AzureADMyOrg"
  },
  {
    id: "7fe7da51-6fb7-4404-a6fc-6fc545a9a5f4",
    appId: "c8e23f0a-4444-4444-8888-000000000004",
    displayName: "ZensusTech Login App",
    createdDateTime: "2026-02-01T11:20:00Z",
    signInAudience: "AzureADMyOrg"
  },
  {
    id: "d97f2cae-a612-42fe-a42e-15bc72917cc1",
    appId: "c8e23f0a-5555-4444-8888-000000000005",
    displayName: "CybaemTech-0365",
    createdDateTime: "2026-05-12T16:45:00Z",
    signInAudience: "AzureADMyOrg"
  }
];

export const DEFAULT_GROUPS = [
  { id: "06aa20f3-7505-4060-b8d5-e6027dde23a2", displayName: "AdminAgents", securityEnabled: true, mailEnabled: false },
  { id: "418e1516-ca42-4376-a901-613552051900", displayName: "All Company", securityEnabled: false, mailEnabled: true },
  { id: "4f9a2668-87fd-4773-8d90-4b87b44645b7", displayName: "PartnerCenter_MPNAdmin", securityEnabled: true, mailEnabled: false },
  { id: "5e0d6f2b-0b98-4e89-8227-9c81b8f2a13e", displayName: "ZensusTech", securityEnabled: false, mailEnabled: true },
  { id: "641a6d71-0120-4e12-8d75-c815f8582b9f", displayName: "Info", securityEnabled: false, mailEnabled: true },
  { id: "8fc77058-52a1-4e8b-82c7-eaaa1044ed61", displayName: "ZensustechCarriers", securityEnabled: false, mailEnabled: true },
  { id: "e18056ae-740e-40bf-af62-f5372f73ccee", displayName: "SalesAgents", securityEnabled: true, mailEnabled: false },
  { id: "f8cbf8cb-0319-4583-bd54-2eebedd7a6a9", displayName: "ZensusTech-Sales", securityEnabled: false, mailEnabled: true },
  { id: "fc9a32c7-7427-4a0b-9dfa-bf9da2a03350", displayName: "Helpdesk", securityEnabled: true, mailEnabled: false }
];

export const DEFAULT_DEVICES = [
  { id: "6c57df5e-48f3-4b5b-b5ef-1172830bd04a", displayName: "Vinay-Magam", operatingSystem: "Windows", operatingSystemVersion: "10.0.26200.8246", isCompliant: true },
  { id: "89fe3b36-9db6-4b12-9f34-5529254d28b7", displayName: "iPhone 13", operatingSystem: "iOS", operatingSystemVersion: "27.0.1", isCompliant: true },
  { id: "90ddf58c-7684-4b39-9a75-ec71625f577f", displayName: "SBee", operatingSystem: "Windows", operatingSystemVersion: "10.0.26200.8457", isCompliant: true },
  { id: "9faf7e6f-d6bd-4948-ac60-69c3ef51b8bb", displayName: "Sidhant04", operatingSystem: "Windows", operatingSystemVersion: "10.0.19045.6456", isCompliant: true },
  { id: "b874a9bf-1c90-4f84-b93c-948830cc1745", displayName: "Wolf", operatingSystem: "Windows", operatingSystemVersion: "10.0.22631.6199", isCompliant: true },
  { id: "c8fef8ae-3c7a-4b45-a2a2-1b77f1ba3a6e", displayName: "iPad (6th generation)", operatingSystem: "iOS", operatingSystemVersion: "17.7.10", isCompliant: true }
];

export const DEFAULT_ORG_DATA = {
  displayName: 'ZensusTech',
  countryLetterCode: 'IN',
  primaryDomain: 'zensustech.com',
  city: 'Pune',
  state: 'Maharashtra',
  street: 'Baner',
  license: 'Microsoft Entra ID P1 / Microsoft 365 Business Standard',
  usersCount: 14,
  groupsCount: 9,
  appsCount: 5,
  devicesCount: 6
};

export const DEFAULT_DASHBOARD_STATS = {
  totalUsers: 14,
  standardUsers: 9,
  globalAdmins: 4,
  totalApps: 5,
  totalGroups: 9,
  totalDevices: 6,
  totalSp: 0,
  compliant: 12,
  mfaDisabled: 2,
  foreign: 0
};


export const DEFAULT_AUDIT_LOGS = [
  {
    "id": "SSGM_4ee071fe-b79a-4158-b8f2-6b9164fc2ebc_001",
    "category": "GroupManagement",
    "correlationId": "4ee071fe-b79a-4158-b8f2-6b9164fc2ebc",
    "result": "success",
    "resultReason": "OK",
    "activityDisplayName": "GroupLifecyclePolicies_Get",
    "activityDateTime": "2026-11-03T08:32:02.417317+00:00",
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "appId": "0ffa2118-1e76-4537-b0d4-0ad853240893",
        "displayName": "CybaemTech-0365",
        "servicePrincipalId": "2e5db490-09ef-49c9-9fe5-76c1525716ae"
      }
    },
    "targetResources": [
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "displayName": "Group Lifecycle Policy",
        "type": "Policy",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "RequestId",
        "value": "62385752-016b-475b-8068-8e7e3fbfb562"
      }
    ]
  },
  {
    "id": "AUTH_8a123f45-e678-4bc9-9812-3456789abcde_002",
    "category": "Authentication",
    "correlationId": "8a123f45-e678-4bc9-9812-3456789abcde",
    "result": "success",
    "resultReason": "MFA Strong Auth Success",
    "activityDisplayName": "User login with MFA verification",
    "activityDateTime": "2026-11-03T07:50:02.417317+00:00",
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "cybaem",
        "userPrincipalName": "cybaem@zensustech.com",
        "ipAddress": "103.21.124.8"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "fecb0d9a-a656-4801-8341-79486d71bc77",
        "displayName": "cybaem",
        "type": "User",
        "userPrincipalName": "cybaem@zensustech.com"
      }
    ],
    "additionalDetails": [
      {
        "key": "AuthMethod",
        "value": "Microsoft Authenticator Push"
      }
    ]
  },
  {
    "id": "AUTH_9c234a56-b789-4cd0-8923-4567890bcdef_003",
    "category": "Authentication",
    "correlationId": "9c234a56-b789-4cd0-8923-4567890bcdef",
    "result": "failure",
    "resultReason": "Invalid password attempt",
    "activityDisplayName": "User login failure (Bad Password)",
    "activityDateTime": "2026-11-03T06:32:02.417317+00:00",
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "Chaithra",
        "userPrincipalName": "Chaithra@zensustech.com",
        "ipAddress": "49.36.110.42"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "4963ff19-c681-4a7e-a044-facb085add51",
        "displayName": "Chaithra",
        "type": "User",
        "userPrincipalName": "Chaithra@zensustech.com"
      }
    ],
    "additionalDetails": [
      {
        "key": "ErrorCode",
        "value": "50126"
      }
    ]
  },
  {
    "id": "USER_1b345c67-c890-4de1-9034-5678901cdef0_004",
    "category": "UserManagement",
    "correlationId": "1b345c67-c890-4de1-9034-5678901cdef0",
    "result": "success",
    "resultReason": "Passkey registered",
    "activityDisplayName": "Get passkey creation options",
    "activityDateTime": "2026-11-03T05:02:02.417317+00:00",
    "loggedByService": "User Management",
    "operationType": "Credential Management",
    "initiatedBy": {
      "user": {
        "displayName": "cybaem",
        "userPrincipalName": "cybaem@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "fecb0d9a-a656-4801-8341-79486d71bc77",
        "displayName": "cybaem",
        "type": "User"
      }
    ],
    "additionalDetails": [
      {
        "key": "PasskeyType",
        "value": "FIDO2 / WebAuthn"
      }
    ]
  },
  {
    "id": "ROLE_2c456d78-d901-4ef2-a145-6789012def01_005",
    "category": "RoleManagement",
    "correlationId": "2c456d78-d901-4ef2-a145-6789012def01",
    "result": "success",
    "resultReason": "Role Verified",
    "activityDisplayName": "Privileged Role Verification (Global Reader)",
    "activityDateTime": "2026-11-03T02:32:02.417317+00:00",
    "loggedByService": "PIM",
    "operationType": "Role Assignment",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "role-gr-01",
        "displayName": "Global Reader",
        "type": "DirectoryRole"
      }
    ],
    "additionalDetails": [
      {
        "key": "AssignmentType",
        "value": "Permanent Active"
      }
    ]
  },
  {
    "id": "APP_3d567e89-ea12-4f03-b256-7890123ef012_006",
    "category": "Application",
    "correlationId": "3d567e89-ea12-4f03-b256-7890123ef012",
    "result": "success",
    "resultReason": "App Token Generated",
    "activityDisplayName": "Service Principal Token Handshake",
    "activityDateTime": "2026-11-02T23:02:02.417317+00:00",
    "loggedByService": "Application Proxy",
    "operationType": "Token Issue",
    "initiatedBy": {
      "user": null,
      "app": {
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae",
        "displayName": "ZensusTechAI-Ops"
      }
    },
    "targetResources": [
      {
        "id": "sp-ai-ops-01",
        "displayName": "ZensusTechAI-Ops",
        "type": "ServicePrincipal"
      }
    ],
    "additionalDetails": [
      {
        "key": "OAuthScope",
        "value": "https://graph.microsoft.com/.default"
      }
    ]
  },
  {
    "id": "GRP_4e678f90-fb23-4014-c367-8901234f0123_007",
    "category": "GroupManagement",
    "correlationId": "4e678f90-fb23-4014-c367-8901234f0123",
    "result": "success",
    "resultReason": "Settings Retrievable",
    "activityDisplayName": "Settings_GetSettingsAsync",
    "activityDateTime": "2026-11-02T19:02:02.417317+00:00",
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "System Service",
        "servicePrincipalId": "2e5db490-09ef-49c9-9fe5-76c1525716ae"
      }
    },
    "targetResources": [
      {
        "id": "00000000-0000-0000-0000-000000000000",
        "displayName": "Tenant Group Policy",
        "type": "Policy"
      }
    ],
    "additionalDetails": [
      {
        "key": "TenantId",
        "value": "9414ece9-9039-40b7-a6a7-7ecbe7409245"
      }
    ]
  },
  {
    "id": "AUTH_5f7890a1-0c34-4125-d478-901234501234_008",
    "category": "Authentication",
    "correlationId": "5f7890a1-0c34-4125-d478-901234501234",
    "result": "failure",
    "resultReason": "MFA challenge timed out",
    "activityDisplayName": "Conditional Access MFA Prompt Timeout",
    "activityDateTime": "2026-11-02T13:02:02.417317+00:00",
    "loggedByService": "Conditional Access",
    "operationType": "Policy Evaluation",
    "initiatedBy": {
      "user": {
        "displayName": "Microsoft",
        "userPrincipalName": "Microsoft@zensustech.com",
        "ipAddress": "104.28.19.74"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "c7496808-c608-4f22-ba16-33eee3aa2bf6",
        "displayName": "Microsoft",
        "type": "User"
      }
    ],
    "additionalDetails": [
      {
        "key": "PolicyName",
        "value": "Enforce MFA for Cloud Apps"
      }
    ]
  },
  {
    "id": "USER_6a8901b2-1d45-4236-e589-012345612345_009",
    "category": "UserManagement",
    "correlationId": "6a8901b2-1d45-4236-e589-012345612345",
    "result": "success",
    "resultReason": "Profile Updated",
    "activityDisplayName": "Update user attributes",
    "activityDateTime": "2026-11-01T21:02:02.417317+00:00",
    "loggedByService": "Core Directory",
    "operationType": "Update",
    "initiatedBy": {
      "user": {
        "displayName": "cybaem",
        "userPrincipalName": "cybaem@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "fecb0d9a-a656-4801-8341-79486d71bc77",
        "displayName": "cybaem",
        "type": "User"
      }
    ],
    "additionalDetails": [
      {
        "key": "Attribute",
        "value": "UsageLocation: IN"
      }
    ]
  },
  {
    "id": "APP_7b9012c3-2e56-4347-f69a-123456723456_010",
    "category": "Application",
    "correlationId": "7b9012c3-2e56-4347-f69a-123456723456",
    "result": "success",
    "resultReason": "Consent granted",
    "activityDisplayName": "Consent to application (CybaemTech-0365)",
    "activityDateTime": "2026-11-01T09:02:02.417317+00:00",
    "loggedByService": "Core Directory",
    "operationType": "Consent",
    "initiatedBy": {
      "user": {
        "displayName": "Global Administrator",
        "userPrincipalName": "admin@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "app-consent-01",
        "displayName": "CybaemTech-0365",
        "type": "Application"
      }
    ],
    "additionalDetails": [
      {
        "key": "Permissions",
        "value": "User.Read, Directory.Read.All"
      }
    ]
  },
  {
    "id": "GRP_8c0123d4-3f67-4458-07ab-234567834567_011",
    "category": "GroupManagement",
    "correlationId": "8c0123d4-3f67-4458-07ab-234567834567",
    "result": "success",
    "resultReason": "Approval Request Completed",
    "activityDisplayName": "Approval_GetAll",
    "activityDateTime": "2026-10-31T21:02:02.417317+00:00",
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "System Service",
        "servicePrincipalId": "2e5db490-09ef-49c9-9fe5-76c1525716ae"
      }
    },
    "targetResources": [
      {
        "id": "grp-approvals-01",
        "displayName": "Access Approvals",
        "type": "Workflow"
      }
    ],
    "additionalDetails": [
      {
        "key": "ResultCode",
        "value": "200"
      }
    ]
  },
  {
    "id": "ROLE_9d1234e5-4078-4569-18bc-345678945678_012",
    "category": "RoleManagement",
    "correlationId": "9d1234e5-4078-4569-18bc-345678945678",
    "result": "success",
    "resultReason": "Role Assignment Added",
    "activityDisplayName": "Add member to role (Security Administrator)",
    "activityDateTime": "2026-10-31T01:02:02.417317+00:00",
    "loggedByService": "PIM",
    "operationType": "Role Assignment",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "role-secadmin-01",
        "displayName": "Security Administrator",
        "type": "DirectoryRole"
      }
    ],
    "additionalDetails": [
      {
        "key": "RoleName",
        "value": "Security Administrator"
      }
    ]
  },
  {
    "id": "AUTH_0e2345f6-5189-467a-29cd-456789056789_013",
    "category": "Authentication",
    "correlationId": "0e2345f6-5189-467a-29cd-456789056789",
    "result": "success",
    "resultReason": "Passwordless FIDO2 Login",
    "activityDisplayName": "User login with FIDO2 Security Key",
    "activityDateTime": "2026-10-29T19:02:02.417317+00:00",
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "cybaem",
        "userPrincipalName": "cybaem@zensustech.com",
        "ipAddress": "103.21.124.8"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "fecb0d9a-a656-4801-8341-79486d71bc77",
        "displayName": "cybaem",
        "type": "User"
      }
    ],
    "additionalDetails": [
      {
        "key": "CredentialType",
        "value": "FIDO2 Security Key"
      }
    ]
  },
  {
    "id": "AUTH_1f3456a7-629a-478b-3ade-567890167890_014",
    "category": "Authentication",
    "correlationId": "1f3456a7-629a-478b-3ade-567890167890",
    "result": "failure",
    "resultReason": "Blocked by IP location filter",
    "activityDisplayName": "Conditional Access Block (Untrusted Location)",
    "activityDateTime": "2026-10-28T13:02:02.417317+00:00",
    "loggedByService": "Conditional Access",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "ExternalGuest",
        "userPrincipalName": "guest@external.org",
        "ipAddress": "185.220.101.5"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "guest-user-01",
        "displayName": "ExternalGuest",
        "type": "User"
      }
    ],
    "additionalDetails": [
      {
        "key": "BlockedCountry",
        "value": "RU"
      }
    ]
  },
  {
    "id": "APP_2a4567b8-73ab-489c-4bef-678901278901_015",
    "category": "Application",
    "correlationId": "2a4567b8-73ab-489c-4bef-678901278901",
    "result": "success",
    "resultReason": "Secret Credential Added",
    "activityDisplayName": "Add service principal credentials",
    "activityDateTime": "2026-10-26T21:02:02.417317+00:00",
    "loggedByService": "Core Directory",
    "operationType": "Key Management",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "sp-test-reg-01",
        "displayName": "Test-App-Registration",
        "type": "ServicePrincipal"
      }
    ],
    "additionalDetails": [
      {
        "key": "KeyType",
        "value": "ClientSecret (24 months)"
      }
    ]
  },
  {
    "id": "USER_3b5678c9-84bc-49ad-5cf0-789012389012_016",
    "category": "UserManagement",
    "correlationId": "3b5678c9-84bc-49ad-5cf0-789012389012",
    "result": "success",
    "resultReason": "Password Reset Success",
    "activityDisplayName": "Self-service password reset flow completed",
    "activityDateTime": "2026-10-24T09:02:02.417317+00:00",
    "loggedByService": "SSPR",
    "operationType": "Password Reset",
    "initiatedBy": {
      "user": {
        "displayName": "Chaithra",
        "userPrincipalName": "Chaithra@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "4963ff19-c681-4a7e-a044-facb085add51",
        "displayName": "Chaithra",
        "type": "User"
      }
    ],
    "additionalDetails": [
      {
        "key": "Method",
        "value": "Mobile OTP + Security Questions"
      }
    ]
  },
  {
    "id": "ROLE_4c6789da-95cd-4abe-6d01-890123490123_017",
    "category": "RoleManagement",
    "correlationId": "4c6789da-95cd-4abe-6d01-890123490123",
    "result": "success",
    "resultReason": "PIM Access Review Completed",
    "activityDisplayName": "PIM Access Review: Global Administrators",
    "activityDateTime": "2026-10-21T01:02:02.417317+00:00",
    "loggedByService": "PIM",
    "operationType": "Access Review",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "role-ga-01",
        "displayName": "Global Administrator",
        "type": "DirectoryRole"
      }
    ],
    "additionalDetails": [
      {
        "key": "ReviewDecision",
        "value": "Approve 4 Admin Accounts"
      }
    ]
  },
  {
    "id": "GRP_5d7890eb-a6de-4bcf-7e12-901234501234_018",
    "category": "GroupManagement",
    "correlationId": "5d7890eb-a6de-4bcf-7e12-901234501234",
    "result": "success",
    "resultReason": "Security Group Modified",
    "activityDisplayName": "Add member to security group (AdminAgents)",
    "activityDateTime": "2026-10-16T21:02:02.417317+00:00",
    "loggedByService": "Core Directory",
    "operationType": "Membership",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "06aa20f3-7505-4060-b8d5-e6027dde23a2",
        "displayName": "AdminAgents",
        "type": "Group"
      }
    ],
    "additionalDetails": [
      {
        "key": "AddedMember",
        "value": "cybaem@zensustech.com"
      }
    ]
  }
];
