metadata description = 'Azure Key Vault (RBAC-authorized) for Phoenix AI secrets. Optionally seeds the database connection string as a secret consumed via a Key Vault reference.'

@description('Key Vault name (3-24 chars, alphanumeric and hyphens).')
@minLength(3)
@maxLength(24)
param name string

@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('Entra tenant ID for the vault.')
param tenantId string = subscription().tenantId

@description('Resource ID of a Log Analytics workspace for diagnostic settings. Empty disables diagnostics.')
param logAnalyticsWorkspaceId string = ''

@description('Optional database connection string to store as the "database-url" secret. Empty skips secret creation.')
@secure()
param databaseConnectionString string = ''

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenantId
    // RBAC data-plane authorization — no access policies, identities are granted via role assignments.
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(databaseConnectionString)) {
  parent: keyVault
  name: 'database-url'
  properties: {
    value: databaseConnectionString
    contentType: 'text/plain'
  }
}

resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsWorkspaceId)) {
  name: 'to-log-analytics'
  scope: keyVault
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        category: 'AuditEvent'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

output id string = keyVault.id
output name string = keyVault.name
output vaultUri string = keyVault.properties.vaultUri
@description('Unversioned Key Vault reference URI for the database-url secret (valid only when a connection string was provided).')
output databaseUrlSecretUri string = '${keyVault.properties.vaultUri}secrets/database-url'
