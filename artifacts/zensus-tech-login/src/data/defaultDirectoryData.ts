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
    "id": "LOG_GRO_00050_01",
    "category": "GroupManagement",
    "correlationId": "corr-groupmanagement-5",
    "result": "success",
    "resultReason": "OK",
    "activityDisplayName": "GroupLifecyclePolicies_Get",
    "hours_ago": 0.5,
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "CybaemTech-0365",
        "appId": "0ffa2118-1e76-4537-b0d4-0ad853240893"
      }
    },
    "targetResources": [
      {
        "id": "res-5",
        "displayName": "Group Lifecycle Policy",
        "type": "Policy",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "GroupManagement"
      },
      {
        "key": "ResultReason",
        "value": "OK"
      }
    ],
    "activityDateTime": "2026-11-03T08:48:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_00120_01",
    "category": "Authentication",
    "correlationId": "corr-authentication-12",
    "result": "success",
    "resultReason": "MFA Strong Auth Success",
    "activityDisplayName": "User login with MFA verification",
    "hours_ago": 1.2,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "cybaem",
        "userPrincipalName": "cybaem@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-12",
        "displayName": "cybaem@zensustech.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "MFA Strong Auth Success"
      }
    ],
    "activityDateTime": "2026-11-03T08:06:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_00250_01",
    "category": "Authentication",
    "correlationId": "corr-authentication-25",
    "result": "failure",
    "resultReason": "Invalid password attempt",
    "activityDisplayName": "User login failure (Bad Password)",
    "hours_ago": 2.5,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "Chaithra",
        "userPrincipalName": "Chaithra@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-25",
        "displayName": "Chaithra@zensustech.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "Invalid password attempt"
      }
    ],
    "activityDateTime": "2026-11-03T06:48:30.522261+00:00"
  },
  {
    "id": "LOG_USE_00400_01",
    "category": "UserManagement",
    "correlationId": "corr-usermanagement-40",
    "result": "success",
    "resultReason": "Passkey registered",
    "activityDisplayName": "Get passkey creation options",
    "hours_ago": 4.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "cybaem",
        "userPrincipalName": "cybaem@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-40",
        "displayName": "cybaem",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "UserManagement"
      },
      {
        "key": "ResultReason",
        "value": "Passkey registered"
      }
    ],
    "activityDateTime": "2026-11-03T05:18:30.522261+00:00"
  },
  {
    "id": "LOG_ROL_00650_01",
    "category": "RoleManagement",
    "correlationId": "corr-rolemanagement-65",
    "result": "success",
    "resultReason": "Role Verified",
    "activityDisplayName": "Privileged Role Verification (Global Reader)",
    "hours_ago": 6.5,
    "loggedByService": "PIM",
    "operationType": "Update",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-65",
        "displayName": "Global Reader",
        "type": "DirectoryRole",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "RoleManagement"
      },
      {
        "key": "ResultReason",
        "value": "Role Verified"
      }
    ],
    "activityDateTime": "2026-11-03T02:48:30.522261+00:00"
  },
  {
    "id": "LOG_APP_01000_01",
    "category": "Application",
    "correlationId": "corr-application-100",
    "result": "success",
    "resultReason": "Token Issued",
    "activityDisplayName": "Service Principal Token Handshake",
    "hours_ago": 10.0,
    "loggedByService": "User Management",
    "operationType": "Update",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "ZensusTechAI-Ops",
        "appId": "0ffa2118-1e76-4537-b0d4-0ad853240893"
      }
    },
    "targetResources": [
      {
        "id": "res-100",
        "displayName": "ZensusTechAI-Ops",
        "type": "ServicePrincipal",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Application"
      },
      {
        "key": "ResultReason",
        "value": "Token Issued"
      }
    ],
    "activityDateTime": "2026-11-02T23:18:30.522261+00:00"
  },
  {
    "id": "LOG_GRO_01400_01",
    "category": "GroupManagement",
    "correlationId": "corr-groupmanagement-140",
    "result": "success",
    "resultReason": "Settings Retrievable",
    "activityDisplayName": "Settings_GetSettingsAsync",
    "hours_ago": 14.0,
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "System Service",
        "appId": "0ffa2118-1e76-4537-b0d4-0ad853240893"
      }
    },
    "targetResources": [
      {
        "id": "res-140",
        "displayName": "Tenant Group Policy",
        "type": "Policy",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "GroupManagement"
      },
      {
        "key": "ResultReason",
        "value": "Settings Retrievable"
      }
    ],
    "activityDateTime": "2026-11-02T19:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_02000_01",
    "category": "Authentication",
    "correlationId": "corr-authentication-200",
    "result": "failure",
    "resultReason": "MFA challenge timed out",
    "activityDisplayName": "Conditional Access MFA Prompt Timeout",
    "hours_ago": 20.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "Microsoft",
        "userPrincipalName": "Microsoft@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-200",
        "displayName": "Microsoft@zensustech.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "MFA challenge timed out"
      }
    ],
    "activityDateTime": "2026-11-02T13:18:30.522261+00:00"
  },
  {
    "id": "LOG_USE_02800_02",
    "category": "UserManagement",
    "correlationId": "corr-usermanagement-280",
    "result": "success",
    "resultReason": "Profile Updated",
    "activityDisplayName": "Update user attributes",
    "hours_ago": 28.0,
    "loggedByService": "User Management",
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
        "id": "res-280",
        "displayName": "cybaem",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "UserManagement"
      },
      {
        "key": "ResultReason",
        "value": "Profile Updated"
      }
    ],
    "activityDateTime": "2026-11-02T05:18:30.522261+00:00"
  },
  {
    "id": "LOG_APP_03600_02",
    "category": "Application",
    "correlationId": "corr-application-360",
    "result": "success",
    "resultReason": "Consent granted",
    "activityDisplayName": "Consent to application (CybaemTech-0365)",
    "hours_ago": 36.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-360",
        "displayName": "CybaemTech-0365",
        "type": "Application",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Application"
      },
      {
        "key": "ResultReason",
        "value": "Consent granted"
      }
    ],
    "activityDateTime": "2026-11-01T21:18:30.522261+00:00"
  },
  {
    "id": "LOG_GRO_04400_02",
    "category": "GroupManagement",
    "correlationId": "corr-groupmanagement-440",
    "result": "success",
    "resultReason": "Approvals retrieved",
    "activityDisplayName": "Approval_GetAll",
    "hours_ago": 44.0,
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "System Service",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-440",
        "displayName": "Access Approvals",
        "type": "Workflow",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "GroupManagement"
      },
      {
        "key": "ResultReason",
        "value": "Approvals retrieved"
      }
    ],
    "activityDateTime": "2026-11-01T13:18:30.522261+00:00"
  },
  {
    "id": "LOG_ROL_05200_02",
    "category": "RoleManagement",
    "correlationId": "corr-rolemanagement-520",
    "result": "success",
    "resultReason": "Role Assigned",
    "activityDisplayName": "Add member to role (Security Administrator)",
    "hours_ago": 52.0,
    "loggedByService": "PIM",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-520",
        "displayName": "Security Administrator",
        "type": "DirectoryRole",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "RoleManagement"
      },
      {
        "key": "ResultReason",
        "value": "Role Assigned"
      }
    ],
    "activityDateTime": "2026-11-01T05:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_06000_02",
    "category": "Authentication",
    "correlationId": "corr-authentication-600",
    "result": "success",
    "resultReason": "FIDO2 Key Verified",
    "activityDisplayName": "Passwordless FIDO2 Login",
    "hours_ago": 60.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "cybaem",
        "userPrincipalName": "cybaem@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-600",
        "displayName": "cybaem",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "FIDO2 Key Verified"
      }
    ],
    "activityDateTime": "2026-10-31T21:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_06800_02",
    "category": "Authentication",
    "correlationId": "corr-authentication-680",
    "result": "failure",
    "resultReason": "Untrusted IP range",
    "activityDisplayName": "Conditional Access Block (Untrusted Location)",
    "hours_ago": 68.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "GuestUser",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-680",
        "displayName": "guest@external.org",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "Untrusted IP range"
      }
    ],
    "activityDateTime": "2026-10-31T13:18:30.522261+00:00"
  },
  {
    "id": "LOG_APP_07600_02",
    "category": "Application",
    "correlationId": "corr-application-760",
    "result": "success",
    "resultReason": "Key Added",
    "activityDisplayName": "Add service principal credentials",
    "hours_ago": 76.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-760",
        "displayName": "Test-App-Registration",
        "type": "ServicePrincipal",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Application"
      },
      {
        "key": "ResultReason",
        "value": "Key Added"
      }
    ],
    "activityDateTime": "2026-10-31T05:18:30.522261+00:00"
  },
  {
    "id": "LOG_USE_08500_02",
    "category": "UserManagement",
    "correlationId": "corr-usermanagement-850",
    "result": "success",
    "resultReason": "Password Reset",
    "activityDisplayName": "Self-service password reset flow completed",
    "hours_ago": 85.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "Chaithra",
        "userPrincipalName": "Chaithra@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-850",
        "displayName": "Chaithra",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "UserManagement"
      },
      {
        "key": "ResultReason",
        "value": "Password Reset"
      }
    ],
    "activityDateTime": "2026-10-30T20:18:30.522261+00:00"
  },
  {
    "id": "LOG_ROL_09500_02",
    "category": "RoleManagement",
    "correlationId": "corr-rolemanagement-950",
    "result": "success",
    "resultReason": "Review Approved",
    "activityDisplayName": "PIM Access Review: Global Administrators",
    "hours_ago": 95.0,
    "loggedByService": "PIM",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-950",
        "displayName": "Global Administrator",
        "type": "DirectoryRole",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "RoleManagement"
      },
      {
        "key": "ResultReason",
        "value": "Review Approved"
      }
    ],
    "activityDateTime": "2026-10-30T10:18:30.522261+00:00"
  },
  {
    "id": "LOG_GRO_10500_02",
    "category": "GroupManagement",
    "correlationId": "corr-groupmanagement-1050",
    "result": "success",
    "resultReason": "Member Added",
    "activityDisplayName": "Add member to security group (AdminAgents)",
    "hours_ago": 105.0,
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-1050",
        "displayName": "AdminAgents",
        "type": "Group",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "GroupManagement"
      },
      {
        "key": "ResultReason",
        "value": "Member Added"
      }
    ],
    "activityDateTime": "2026-10-30T00:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_11500_02",
    "category": "Authentication",
    "correlationId": "corr-authentication-1150",
    "result": "success",
    "resultReason": "Passkey Verified",
    "activityDisplayName": "Interactive user sign-in",
    "hours_ago": 115.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "vinay@zensustech.com",
        "userPrincipalName": "vinay@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-1150",
        "displayName": "vinay@zensustech.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "Passkey Verified"
      }
    ],
    "activityDateTime": "2026-10-29T14:18:30.522261+00:00"
  },
  {
    "id": "LOG_APP_12500_02",
    "category": "Application",
    "correlationId": "corr-application-1250",
    "result": "failure",
    "resultReason": "Expired client secret",
    "activityDisplayName": "OAuth application token request failed",
    "hours_ago": 125.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "ZensusTech Login App",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-1250",
        "displayName": "ZensusTech Login App",
        "type": "Application",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Application"
      },
      {
        "key": "ResultReason",
        "value": "Expired client secret"
      }
    ],
    "activityDateTime": "2026-10-29T04:18:30.522261+00:00"
  },
  {
    "id": "LOG_GRO_13500_02",
    "category": "GroupManagement",
    "correlationId": "corr-groupmanagement-1350",
    "result": "success",
    "resultReason": "Group Updated",
    "activityDisplayName": "Update group display name",
    "hours_ago": 135.0,
    "loggedByService": "Self-service Group Management",
    "operationType": "Update",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-1350",
        "displayName": "ZensusTech-Sales",
        "type": "Group",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "GroupManagement"
      },
      {
        "key": "ResultReason",
        "value": "Group Updated"
      }
    ],
    "activityDateTime": "2026-10-28T18:18:30.522261+00:00"
  },
  {
    "id": "LOG_ROL_14200_02",
    "category": "RoleManagement",
    "correlationId": "corr-rolemanagement-1420",
    "result": "failure",
    "resultReason": "Elevation denied by policy",
    "activityDisplayName": "Privilege escalation request rejected",
    "hours_ago": 142.0,
    "loggedByService": "PIM",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "cybaem",
        "userPrincipalName": "cybaem@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-1420",
        "displayName": "Global Administrator",
        "type": "DirectoryRole",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "RoleManagement"
      },
      {
        "key": "ResultReason",
        "value": "Elevation denied by policy"
      }
    ],
    "activityDateTime": "2026-10-28T11:18:30.522261+00:00"
  },
  {
    "id": "LOG_USE_14800_02",
    "category": "UserManagement",
    "correlationId": "corr-usermanagement-1480",
    "result": "success",
    "resultReason": "Account Activated",
    "activityDisplayName": "User account enabled",
    "hours_ago": 148.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-1480",
        "displayName": "cybaem@zensustech.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "UserManagement"
      },
      {
        "key": "ResultReason",
        "value": "Account Activated"
      }
    ],
    "activityDateTime": "2026-10-28T05:18:30.522261+00:00"
  },
  {
    "id": "LOG_USE_15400_02",
    "category": "UserManagement",
    "correlationId": "corr-usermanagement-1540",
    "result": "success",
    "resultReason": "Workplace Joined",
    "activityDisplayName": "Device registration completed",
    "hours_ago": 154.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "cybaem",
        "userPrincipalName": "cybaem@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-1540",
        "displayName": "Vinay-Magam",
        "type": "Device",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "UserManagement"
      },
      {
        "key": "ResultReason",
        "value": "Workplace Joined"
      }
    ],
    "activityDateTime": "2026-10-27T23:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_15800_02",
    "category": "Authentication",
    "correlationId": "corr-authentication-1580",
    "result": "failure",
    "resultReason": "Rate limit exceeded",
    "activityDisplayName": "Sign-in throttled (Too many requests)",
    "hours_ago": 158.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "UnknownActor",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-1580",
        "displayName": "external@anon.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "Rate limit exceeded"
      }
    ],
    "activityDateTime": "2026-10-27T19:18:30.522261+00:00"
  },
  {
    "id": "LOG_GRO_16000_02",
    "category": "GroupManagement",
    "correlationId": "corr-groupmanagement-1600",
    "result": "success",
    "resultReason": "Member Removed",
    "activityDisplayName": "Group member removed",
    "hours_ago": 160.0,
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-1600",
        "displayName": "SalesAgents",
        "type": "Group",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "GroupManagement"
      },
      {
        "key": "ResultReason",
        "value": "Member Removed"
      }
    ],
    "activityDateTime": "2026-10-27T17:18:30.522261+00:00"
  },
  {
    "id": "LOG_GRO_18500_03",
    "category": "GroupManagement",
    "correlationId": "corr-groupmanagement-1850",
    "result": "success",
    "resultReason": "Sync Successful",
    "activityDisplayName": "Directory synchronization cycle completed",
    "hours_ago": 185.0,
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "SyncService",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-1850",
        "displayName": "Entra ID Connect",
        "type": "Directory",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "GroupManagement"
      },
      {
        "key": "ResultReason",
        "value": "Sync Successful"
      }
    ],
    "activityDateTime": "2026-10-26T16:18:30.522261+00:00"
  },
  {
    "id": "LOG_APP_20000_03",
    "category": "Application",
    "correlationId": "corr-application-2000",
    "result": "success",
    "resultReason": "Permissions Granted",
    "activityDisplayName": "Add delegated permission grants",
    "hours_ago": 200.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-2000",
        "displayName": "Microsoft Graph",
        "type": "OAuth2PermissionGrant",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Application"
      },
      {
        "key": "ResultReason",
        "value": "Permissions Granted"
      }
    ],
    "activityDateTime": "2026-10-26T01:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_22000_03",
    "category": "Authentication",
    "correlationId": "corr-authentication-2200",
    "result": "success",
    "resultReason": "Break-glass Auth",
    "activityDisplayName": "Emergency Access Account Sign-in",
    "hours_ago": 220.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "breakglass@zensustech.com",
        "userPrincipalName": "breakglass@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-2200",
        "displayName": "breakglass@zensustech.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "Break-glass Auth"
      }
    ],
    "activityDateTime": "2026-10-25T05:18:30.522261+00:00"
  },
  {
    "id": "LOG_ROL_24000_03",
    "category": "RoleManagement",
    "correlationId": "corr-rolemanagement-2400",
    "result": "success",
    "resultReason": "Policy Enacted",
    "activityDisplayName": "Conditional Access policy created",
    "hours_ago": 240.0,
    "loggedByService": "PIM",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-2400",
        "displayName": "Require MFA for Admins",
        "type": "Policy",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "RoleManagement"
      },
      {
        "key": "ResultReason",
        "value": "Policy Enacted"
      }
    ],
    "activityDateTime": "2026-10-24T09:18:30.522261+00:00"
  },
  {
    "id": "LOG_APP_26000_03",
    "category": "Application",
    "correlationId": "corr-application-2600",
    "result": "success",
    "resultReason": "SP Removed",
    "activityDisplayName": "Service principal deleted",
    "hours_ago": 260.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-2600",
        "displayName": "Deprecated-Integration",
        "type": "ServicePrincipal",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Application"
      },
      {
        "key": "ResultReason",
        "value": "SP Removed"
      }
    ],
    "activityDateTime": "2026-10-23T13:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_28000_03",
    "category": "Authentication",
    "correlationId": "corr-authentication-2800",
    "result": "failure",
    "resultReason": "Blocked by Smart Lockout",
    "activityDisplayName": "Password spray attempt blocked",
    "hours_ago": 280.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "ThreatIntelBot",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-2800",
        "displayName": "multiple@zensustech.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "Blocked by Smart Lockout"
      }
    ],
    "activityDateTime": "2026-10-22T17:18:30.522261+00:00"
  },
  {
    "id": "LOG_USE_30000_03",
    "category": "UserManagement",
    "correlationId": "corr-usermanagement-3000",
    "result": "success",
    "resultReason": "14 Users Validated",
    "activityDisplayName": "Bulk user import completed",
    "hours_ago": 300.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-3000",
        "displayName": "CSV Import",
        "type": "Batch",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "UserManagement"
      },
      {
        "key": "ResultReason",
        "value": "14 Users Validated"
      }
    ],
    "activityDateTime": "2026-10-21T21:18:30.522261+00:00"
  },
  {
    "id": "LOG_USE_32000_03",
    "category": "UserManagement",
    "correlationId": "corr-usermanagement-3200",
    "result": "success",
    "resultReason": "Business Basic Assigned",
    "activityDisplayName": "License assigned to user",
    "hours_ago": 320.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-3200",
        "displayName": "Microsoft 365 Business Basic",
        "type": "License",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "UserManagement"
      },
      {
        "key": "ResultReason",
        "value": "Business Basic Assigned"
      }
    ],
    "activityDateTime": "2026-10-21T01:18:30.522261+00:00"
  },
  {
    "id": "LOG_ROL_34000_03",
    "category": "RoleManagement",
    "correlationId": "corr-rolemanagement-3400",
    "result": "success",
    "resultReason": "PIM Activation",
    "activityDisplayName": "Privileged role activation requested",
    "hours_ago": 340.0,
    "loggedByService": "PIM",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-3400",
        "displayName": "Global Administrator",
        "type": "DirectoryRole",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "RoleManagement"
      },
      {
        "key": "ResultReason",
        "value": "PIM Activation"
      }
    ],
    "activityDateTime": "2026-10-20T05:18:30.522261+00:00"
  },
  {
    "id": "LOG_APP_36000_03",
    "category": "Application",
    "correlationId": "corr-application-3600",
    "result": "failure",
    "resultReason": "High-risk permissions blocked",
    "activityDisplayName": "Malicious app consent attempt detected",
    "hours_ago": 360.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "SuspiciousApp",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-3600",
        "displayName": "Unknown OAuth App",
        "type": "Application",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Application"
      },
      {
        "key": "ResultReason",
        "value": "High-risk permissions blocked"
      }
    ],
    "activityDateTime": "2026-10-19T09:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_38000_03",
    "category": "Authentication",
    "correlationId": "corr-authentication-3800",
    "result": "success",
    "resultReason": "Custom Ban List Active",
    "activityDisplayName": "Password protection policy enforced",
    "hours_ago": 380.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "SecurityAdmin",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-3800",
        "displayName": "Banned Passwords",
        "type": "Policy",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "Custom Ban List Active"
      }
    ],
    "activityDateTime": "2026-10-18T13:18:30.522261+00:00"
  },
  {
    "id": "LOG_GRO_41000_03",
    "category": "GroupManagement",
    "correlationId": "corr-groupmanagement-4100",
    "result": "success",
    "resultReason": "Group Created",
    "activityDisplayName": "Security group created (ZensusTechCarriers)",
    "hours_ago": 410.0,
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-4100",
        "displayName": "ZensustechCarriers",
        "type": "Group",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "GroupManagement"
      },
      {
        "key": "ResultReason",
        "value": "Group Created"
      }
    ],
    "activityDateTime": "2026-10-17T07:18:30.522261+00:00"
  },
  {
    "id": "LOG_USE_44000_03",
    "category": "UserManagement",
    "correlationId": "corr-usermanagement-4400",
    "result": "success",
    "resultReason": "Guest Joined",
    "activityDisplayName": "User invitation accepted",
    "hours_ago": 440.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "guest@partner.com",
        "userPrincipalName": "guest@partner.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-4400",
        "displayName": "guest@partner.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "UserManagement"
      },
      {
        "key": "ResultReason",
        "value": "Guest Joined"
      }
    ],
    "activityDateTime": "2026-10-16T01:18:30.522261+00:00"
  },
  {
    "id": "LOG_APP_47000_03",
    "category": "Application",
    "correlationId": "corr-application-4700",
    "result": "failure",
    "resultReason": "Secret Expired",
    "activityDisplayName": "Stale service principal secret expired",
    "hours_ago": 470.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "System Monitoring",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-4700",
        "displayName": "Legacy-Feed",
        "type": "ServicePrincipal",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Application"
      },
      {
        "key": "ResultReason",
        "value": "Secret Expired"
      }
    ],
    "activityDateTime": "2026-10-14T19:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_50000_03",
    "category": "Authentication",
    "correlationId": "corr-authentication-5000",
    "result": "success",
    "resultReason": "Registration Required",
    "activityDisplayName": "MFA registration policy updated",
    "hours_ago": 500.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-5000",
        "displayName": "MFA Registration Policy",
        "type": "Policy",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "Registration Required"
      }
    ],
    "activityDateTime": "2026-10-13T13:18:30.522261+00:00"
  },
  {
    "id": "LOG_ROL_53000_03",
    "category": "RoleManagement",
    "correlationId": "corr-rolemanagement-5300",
    "result": "success",
    "resultReason": "Least Privilege Enforced",
    "activityDisplayName": "Role assignment removed",
    "hours_ago": 530.0,
    "loggedByService": "PIM",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-5300",
        "displayName": "Application Administrator",
        "type": "DirectoryRole",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "RoleManagement"
      },
      {
        "key": "ResultReason",
        "value": "Least Privilege Enforced"
      }
    ],
    "activityDateTime": "2026-10-12T07:18:30.522261+00:00"
  },
  {
    "id": "LOG_GRO_56000_03",
    "category": "GroupManagement",
    "correlationId": "corr-groupmanagement-5600",
    "result": "success",
    "resultReason": "Mail Enabled",
    "activityDisplayName": "Group mail settings updated",
    "hours_ago": 560.0,
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-5600",
        "displayName": "Info",
        "type": "Group",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "GroupManagement"
      },
      {
        "key": "ResultReason",
        "value": "Mail Enabled"
      }
    ],
    "activityDateTime": "2026-10-11T01:18:30.522261+00:00"
  },
  {
    "id": "LOG_USE_59000_03",
    "category": "UserManagement",
    "correlationId": "corr-usermanagement-5900",
    "result": "failure",
    "resultReason": "Risky User Detected",
    "activityDisplayName": "User risk level changed to High",
    "hours_ago": 590.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "Identity Protection",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-5900",
        "displayName": "Microsoft@zensustech.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "UserManagement"
      },
      {
        "key": "ResultReason",
        "value": "Risky User Detected"
      }
    ],
    "activityDateTime": "2026-10-09T19:18:30.522261+00:00"
  },
  {
    "id": "LOG_APP_62000_03",
    "category": "Application",
    "correlationId": "corr-application-6200",
    "result": "success",
    "resultReason": "Key Rotated",
    "activityDisplayName": "Application sign-in key rotated",
    "hours_ago": 620.0,
    "loggedByService": "User Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-6200",
        "displayName": "CybaemTech-0365",
        "type": "KeyCredential",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Application"
      },
      {
        "key": "ResultReason",
        "value": "Key Rotated"
      }
    ],
    "activityDateTime": "2026-10-08T13:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_64000_03",
    "category": "Authentication",
    "correlationId": "corr-authentication-6400",
    "result": "success",
    "resultReason": "FIDO2 Key Registered",
    "activityDisplayName": "FIDO2 security key registration",
    "hours_ago": 640.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-6400",
        "displayName": "admin@zensustech.com",
        "type": "User",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "FIDO2 Key Registered"
      }
    ],
    "activityDateTime": "2026-10-07T17:18:30.522261+00:00"
  },
  {
    "id": "LOG_GRO_66000_03",
    "category": "GroupManagement",
    "correlationId": "corr-groupmanagement-6600",
    "result": "success",
    "resultReason": "Contact Updated",
    "activityDisplayName": "Tenant technical contact updated",
    "hours_ago": 660.0,
    "loggedByService": "Self-service Group Management",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-6600",
        "displayName": "ZensusTech Tenant",
        "type": "Tenant",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "GroupManagement"
      },
      {
        "key": "ResultReason",
        "value": "Contact Updated"
      }
    ],
    "activityDateTime": "2026-10-06T21:18:30.522261+00:00"
  },
  {
    "id": "LOG_AUT_68000_03",
    "category": "Authentication",
    "correlationId": "corr-authentication-6800",
    "result": "success",
    "resultReason": "Domain Verified",
    "activityDisplayName": "External domain federation verified",
    "hours_ago": 680.0,
    "loggedByService": "Core Directory",
    "operationType": "Sign-in",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-6800",
        "displayName": "zensustech.com",
        "type": "Domain",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "Authentication"
      },
      {
        "key": "ResultReason",
        "value": "Domain Verified"
      }
    ],
    "activityDateTime": "2026-10-06T01:18:30.522261+00:00"
  },
  {
    "id": "LOG_ROL_69500_03",
    "category": "RoleManagement",
    "correlationId": "corr-rolemanagement-6950",
    "result": "success",
    "resultReason": "Entitlement Management",
    "activityDisplayName": "Access package assignment granted",
    "hours_ago": 695.0,
    "loggedByService": "PIM",
    "operationType": "Read",
    "initiatedBy": {
      "user": {
        "displayName": "admin@zensustech.com",
        "userPrincipalName": "admin@zensustech.com@zensustech.com"
      },
      "app": null
    },
    "targetResources": [
      {
        "id": "res-6950",
        "displayName": "Default Developer Access",
        "type": "AccessPackage",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "RoleManagement"
      },
      {
        "key": "ResultReason",
        "value": "Entitlement Management"
      }
    ],
    "activityDateTime": "2026-10-05T10:18:30.522261+00:00"
  },
  {
    "id": "LOG_ROL_70000_03",
    "category": "RoleManagement",
    "correlationId": "corr-rolemanagement-7000",
    "result": "success",
    "resultReason": "Secure Score Updated",
    "activityDisplayName": "Security baseline assessment completed",
    "hours_ago": 700.0,
    "loggedByService": "PIM",
    "operationType": "Read",
    "initiatedBy": {
      "user": null,
      "app": {
        "displayName": "Defender Engine",
        "appId": "31d16397-9b29-4d39-9d2b-5e29446f57ae"
      }
    },
    "targetResources": [
      {
        "id": "res-7000",
        "displayName": "Microsoft 365 Tenant Posture",
        "type": "SecureScore",
        "modifiedProperties": []
      }
    ],
    "additionalDetails": [
      {
        "key": "Category",
        "value": "RoleManagement"
      },
      {
        "key": "ResultReason",
        "value": "Secure Score Updated"
      }
    ],
    "activityDateTime": "2026-10-05T05:18:30.522261+00:00"
  }
];
