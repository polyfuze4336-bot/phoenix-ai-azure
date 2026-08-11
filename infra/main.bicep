metadata description = 'Phoenix AI — Azure infrastructure (parity demo). Creates the resource group and provisions App Service (Linux Node), PostgreSQL Flexible Server, Blob Storage, Key Vault, Application Insights, Log Analytics and a managed identity, and connects to an EXISTING Microsoft Foundry model deployment.'

targetScope = 'subscription'

// ---------------------------------------------------------------------------
// Core parameters
// ---------------------------------------------------------------------------

@description('Azure region for the new resources. Defaults to the region of the reused Foundry account.')
param location string = 'eastus2'

@description('Name of the resource group to create.')
param resourceGroupName string = 'rg-phoenixai-demo'

@description('Short prefix used in resource names.')
param namePrefix string = 'phoenixai'

@description('Owner tag value (person or team responsible).')
param owner string = ''

@description('Cost centre tag value.')
param costCentre string = ''

// ---------------------------------------------------------------------------
// Reused Microsoft Foundry / Azure OpenAI (NOT created here)
// ---------------------------------------------------------------------------

@description('Resource group of the existing Foundry / Azure OpenAI account to reuse.')
param foundryResourceGroupName string = 'rg-aisgemini-dev'

@description('Name of the existing Foundry / Azure OpenAI account to reuse.')
param foundryAccountName string = 'aif-yfjw6y'

@description('Existing vision-capable model deployment name on the Foundry account.')
param foundryModelDeployment string = 'gpt-4o'

@description('Azure OpenAI API version used by the app.')
param aiApiVersion string = '2024-10-21'

@description('Enable reuse of an existing Foundry / Azure OpenAI account. Set to true to grant the app access to an existing account; defaults to false to allow deployments without Foundry.')
param enableFoundryConnection bool = false

// ---------------------------------------------------------------------------
// PostgreSQL
// ---------------------------------------------------------------------------

@description('PostgreSQL administrator login.')
param postgresAdminLogin string = 'phoenixadmin'

@description('PostgreSQL administrator password. Supply at deploy time (env var / pipeline secret).')
@secure()
param postgresAdminPassword string

@description('Initial application database name.')
param postgresDatabaseName string = 'phoenix'

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

@description('Authentication mode for the app (parity default: demo).')
@allowed([
  'demo'
  'entra'
])
param authMode string = 'demo'

@description('App Service plan SKU name (default B1 Basic; use F1 in quota-constrained sandboxes).')
param appServicePlanSkuName string = 'B1'

@description('App Service plan SKU tier (default Basic; use Free with F1).')
param appServicePlanSkuTier string = 'Basic'

@description('Keep the app warm. Automatically disabled on the Free tier, which does not support it.')
param appServiceAlwaysOn bool = true

@description('Optional email address for operational alerts. Empty creates the action group with no receivers.')
param alertEmailAddress string = ''

// ---------------------------------------------------------------------------
// Tags + naming
// ---------------------------------------------------------------------------

var tags = {
  Application: 'PhoenixAI'
  Environment: 'Demo'
  Workload: 'BurnAndWoundCare'
  ManagedBy: 'Bicep'
  Owner: owner
  CostCentre: costCentre
}

var resourceToken = uniqueString(subscription().id, resourceGroupName)

var names = {
  logAnalytics: 'log-${namePrefix}-${resourceToken}'
  appInsights: 'appi-${namePrefix}-${resourceToken}'
  managedIdentity: 'id-${namePrefix}-${resourceToken}'
  keyVault: 'kv-phx-${take(resourceToken, 17)}'
  storage: 'stphx${take(resourceToken, 19)}'
  postgres: 'psql-${namePrefix}-${resourceToken}'
  plan: 'plan-${namePrefix}-${resourceToken}'
  app: 'app-${namePrefix}-${resourceToken}'
}

// Database connection string stored as a Key Vault secret and consumed via a Key Vault reference.
var databaseConnectionString = 'postgresql://${postgresAdminLogin}:${postgresAdminPassword}@${postgres.outputs.fqdn}:5432/${postgresDatabaseName}?sslmode=require'

// ---------------------------------------------------------------------------
// Resource group
// ---------------------------------------------------------------------------

resource rg 'Microsoft.Resources/resourceGroups@2024-11-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// ---------------------------------------------------------------------------
// Observability
// ---------------------------------------------------------------------------

module logAnalytics 'modules/log-analytics.bicep' = {
  name: 'logAnalytics'
  scope: rg
  params: {
    name: names.logAnalytics
    location: location
    tags: tags
  }
}

module appInsights 'modules/application-insights.bicep' = {
  name: 'appInsights'
  scope: rg
  params: {
    name: names.appInsights
    location: location
    tags: tags
    logAnalyticsWorkspaceId: logAnalytics.outputs.id
  }
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

module managedIdentity 'modules/managed-identity.bicep' = {
  name: 'managedIdentity'
  scope: rg
  params: {
    name: names.managedIdentity
    location: location
    tags: tags
  }
}

// ---------------------------------------------------------------------------
// Data + secrets
// ---------------------------------------------------------------------------

module postgres 'modules/postgresql.bicep' = {
  name: 'postgres'
  scope: rg
  params: {
    name: names.postgres
    location: location
    tags: tags
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    databaseName: postgresDatabaseName
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage'
  scope: rg
  params: {
    name: names.storage
    location: location
    tags: tags
    logAnalyticsWorkspaceId: logAnalytics.outputs.id
  }
}

module keyVault 'modules/key-vault.bicep' = {
  name: 'keyVault'
  scope: rg
  params: {
    name: names.keyVault
    location: location
    tags: tags
    logAnalyticsWorkspaceId: logAnalytics.outputs.id
    databaseConnectionString: databaseConnectionString
  }
}

// ---------------------------------------------------------------------------
// Reused Foundry model connection (cross-resource-group RBAC + endpoint)
// ---------------------------------------------------------------------------

module foundryConnection 'modules/foundry-connection.bicep' = if (enableFoundryConnection) {
  name: 'foundryConnection'
  scope: resourceGroup(foundryResourceGroupName)
  params: {
    foundryAccountName: foundryAccountName
    principalId: managedIdentity.outputs.principalId
  }
}

// ---------------------------------------------------------------------------
// Compute
// ---------------------------------------------------------------------------

module appServicePlan 'modules/app-service-plan.bicep' = {
  name: 'appServicePlan'
  scope: rg
  params: {
    name: names.plan
    location: location
    tags: tags
    skuName: appServicePlanSkuName
    skuTier: appServicePlanSkuTier
  }
}

module appService 'modules/app-service.bicep' = {
  name: 'appService'
  scope: rg
  params: {
    name: names.app
    location: location
    tags: tags
    appServicePlanId: appServicePlan.outputs.id
    managedIdentityId: managedIdentity.outputs.id
    managedIdentityClientId: managedIdentity.outputs.clientId
    appInsightsConnectionString: appInsights.outputs.connectionString
    // Pass the Foundry endpoint if the reuse flag is enabled; otherwise pass
    // an empty string so the app deploys without AI integration.
    aiEndpoint: enableFoundryConnection ? foundryConnection.outputs.endpoint : ''
    aiModelDeployment: foundryModelDeployment
    aiApiVersion: aiApiVersion
    storageBlobEndpoint: storage.outputs.blobEndpoint
    storageContainerName: storage.outputs.containerName
    databaseUrlSecretUri: keyVault.outputs.databaseUrlSecretUri
    authMode: authMode
    alwaysOn: appServicePlanSkuTier == 'Free' ? false : appServiceAlwaysOn
    logAnalyticsWorkspaceId: logAnalytics.outputs.id
  }
}

// ---------------------------------------------------------------------------
// Least-privilege role assignments for the app identity
// ---------------------------------------------------------------------------

module roleAssignments 'modules/role-assignments.bicep' = {
  name: 'roleAssignments'
  scope: rg
  params: {
    principalId: managedIdentity.outputs.principalId
    keyVaultName: keyVault.outputs.name
    storageAccountName: storage.outputs.name
    appInsightsName: appInsights.outputs.name
  }
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

module alerts 'modules/alerts.bicep' = {
  name: 'alerts'
  scope: rg
  params: {
    tags: tags
    appServiceId: appService.outputs.id
    alertEmailAddress: alertEmailAddress
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output resourceGroupName string = rg.name
output location string = location
output appServiceName string = appService.outputs.name
output appServiceUrl string = appService.outputs.url
output appServiceDefaultHostname string = appService.outputs.defaultHostname
output managedIdentityClientId string = managedIdentity.outputs.clientId
output managedIdentityPrincipalId string = managedIdentity.outputs.principalId
output keyVaultName string = keyVault.outputs.name
output storageAccountName string = storage.outputs.name
output storageBlobEndpoint string = storage.outputs.blobEndpoint
output postgresFqdn string = postgres.outputs.fqdn
output logAnalyticsWorkspaceId string = logAnalytics.outputs.id
output appInsightsName string = appInsights.outputs.name
output foundryEndpoint string = enableFoundryConnection ? foundryConnection.outputs.endpoint : ''
output foundryModelDeployment string = foundryModelDeployment
