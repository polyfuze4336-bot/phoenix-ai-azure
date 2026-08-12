metadata description = 'Phoenix AI Azure infrastructure. Creates the resource group and provisions Azure Container Apps, ACR, Azure AI Services with gpt-4o, PostgreSQL, Blob Storage, Key Vault, Application Insights, Log Analytics and a managed identity.'

targetScope = 'subscription'

// ---------------------------------------------------------------------------
// Core parameters
// ---------------------------------------------------------------------------

@description('Azure region for all environment-owned resources.')
param location string = 'eastus2'

@description('Name of the resource group to create.')
param resourceGroupName string = 'rg-phoenixai-bfgs-demo'

@description('Short prefix used in resource names.')
param namePrefix string = 'phoenixai'

@description('Owner tag value (person or team responsible).')
param owner string = ''

@description('Cost centre tag value.')
param costCentre string = ''

// ---------------------------------------------------------------------------
// Environment-owned Microsoft Foundry / Azure AI Services
// ---------------------------------------------------------------------------

@description('Vision-capable model deployment name on the environment-owned Azure AI account.')
param foundryModelDeployment string = 'gpt-4o'

@description('Pinned gpt-4o model version used by the parity baseline.')
param foundryModelVersion string = '2024-11-20'

@description('Global Standard model capacity in thousands of tokens per minute.')
@minValue(1)
param foundryModelCapacity int = 10

@description('Azure OpenAI API version used by the app.')
param aiApiVersion string = '2024-10-21'

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

@description('PostgreSQL major version.')
param postgresVersion string = '17'

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

@description('Authentication mode for the app (parity default: demo).')
@allowed([
  'demo'
  'entra'
])
param authMode string = 'demo'

@description('Immutable tag of the Phoenix AI image built in this environment ACR.')
param containerImageTag string = 'latest'

@description('Deploy the Container App after its image has been built in ACR. Set false during bootstrap.')
param deployContainerApp bool = true

@description('Minimum Container App replicas. Zero enables scale-to-zero for the demo.')
@minValue(0)
param containerMinReplicas int = 0

@description('Maximum Container App replicas.')
@minValue(1)
param containerMaxReplicas int = 3

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
  foundry: 'aif-${namePrefix}-${resourceToken}'
  keyVault: 'kv-phx-${take(resourceToken, 17)}'
  storage: 'stphx${take(resourceToken, 19)}'
  postgres: 'psql-${namePrefix}-${resourceToken}'
  containerRegistry: 'acrphx${take(resourceToken, 18)}'
  containerEnvironment: 'cae-${namePrefix}-${resourceToken}'
  containerApp: 'ca-${namePrefix}-${resourceToken}'
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
    postgresVersion: postgresVersion
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
// Environment-owned Azure AI account, model deployment, RBAC + endpoint
// ---------------------------------------------------------------------------

module foundryConnection 'modules/foundry-connection.bicep' = {
  name: 'foundryConnection'
  scope: rg
  params: {
    name: names.foundry
    location: location
    tags: tags
    modelDeploymentName: foundryModelDeployment
    modelVersion: foundryModelVersion
    modelCapacity: foundryModelCapacity
    principalId: managedIdentity.outputs.principalId
  }
}

// ---------------------------------------------------------------------------
// Compute
// ---------------------------------------------------------------------------

module containerRegistry 'modules/container-registry.bicep' = {
  name: 'containerRegistry'
  scope: rg
  params: {
    name: names.containerRegistry
    location: location
    tags: tags
  }
}

module containerEnvironment 'modules/container-app-environment.bicep' = {
  name: 'containerEnvironment'
  scope: rg
  params: {
    name: names.containerEnvironment
    location: location
    tags: tags
    logAnalyticsWorkspaceName: logAnalytics.outputs.name
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
    containerRegistryName: containerRegistry.outputs.name
  }
}

module containerApp 'modules/container-app.bicep' = if (deployContainerApp) {
  name: 'containerApp'
  scope: rg
  params: {
    name: names.containerApp
    location: location
    tags: tags
    environmentId: containerEnvironment.outputs.id
    containerImage: '${containerRegistry.outputs.loginServer}/phoenixai:${containerImageTag}'
    registryServer: containerRegistry.outputs.loginServer
    managedIdentityId: managedIdentity.outputs.id
    managedIdentityClientId: managedIdentity.outputs.clientId
    appInsightsConnectionString: appInsights.outputs.connectionString
    aiEndpoint: foundryConnection.outputs.endpoint
    aiModelDeployment: foundryModelDeployment
    aiApiVersion: aiApiVersion
    storageBlobEndpoint: storage.outputs.blobEndpoint
    storageContainerName: storage.outputs.containerName
    databaseUrlSecretUri: keyVault.outputs.databaseUrlSecretUri
    authMode: authMode
    minReplicas: containerMinReplicas
    maxReplicas: containerMaxReplicas
  }
  dependsOn: [
    roleAssignments
  ]
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

module alerts 'modules/alerts.bicep' = {
  name: 'alerts'
  scope: rg
  params: {
    tags: tags
    appInsightsId: appInsights.outputs.id
    alertEmailAddress: alertEmailAddress
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

output resourceGroupName string = rg.name
output location string = location
output containerAppName string = deployContainerApp ? containerApp!.outputs.name : ''
output containerAppUrl string = deployContainerApp ? containerApp!.outputs.url : ''
output containerAppFqdn string = deployContainerApp ? containerApp!.outputs.fqdn : ''
output containerRegistryName string = containerRegistry.outputs.name
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
output containerEnvironmentName string = containerEnvironment.outputs.name
output managedIdentityClientId string = managedIdentity.outputs.clientId
output managedIdentityPrincipalId string = managedIdentity.outputs.principalId
output keyVaultName string = keyVault.outputs.name
output storageAccountName string = storage.outputs.name
output storageBlobEndpoint string = storage.outputs.blobEndpoint
output postgresFqdn string = postgres.outputs.fqdn
output logAnalyticsWorkspaceId string = logAnalytics.outputs.id
output appInsightsName string = appInsights.outputs.name
output foundryAccountName string = foundryConnection.outputs.accountName
output foundryEndpoint string = foundryConnection.outputs.endpoint
output foundryModelDeployment string = foundryModelDeployment
