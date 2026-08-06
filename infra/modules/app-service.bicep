metadata description = 'Azure App Service (Linux, Node) hosting the Phoenix AI Next.js app as a full Node.js server (not a static export). Uses a user-assigned managed identity for Key Vault, Storage and Foundry.'

@description('Web app name (also the default hostname prefix).')
param name string

@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('Resource ID of the Linux App Service plan.')
param appServicePlanId string

@description('Resource ID of the user-assigned managed identity.')
param managedIdentityId string

@description('Client ID of the user-assigned managed identity (for DefaultAzureCredential / Key Vault references).')
param managedIdentityClientId string

@description('Node runtime version stack, e.g. NODE|22-lts.')
param linuxFxVersion string = 'NODE|22-lts'

@description('Startup command. Next.js standalone output runs "node server.js".')
param appCommandLine string = 'node server.js'

@description('Keep the app warm. Not supported on Free/Shared tiers, so set false there.')
param alwaysOn bool = true

@description('Application Insights connection string.')
param appInsightsConnectionString string

@description('Foundry / Azure OpenAI endpoint (bare account endpoint).')
param aiEndpoint string

@description('Foundry / Azure OpenAI model deployment name (vision-capable chat model).')
param aiModelDeployment string

@description('Azure OpenAI API version.')
param aiApiVersion string = '2024-10-21'

@description('Blob endpoint of the storage account.')
param storageBlobEndpoint string

@description('Private blob container name.')
param storageContainerName string

@description('Key Vault reference URI for the database-url secret. Empty omits DATABASE_URL.')
param databaseUrlSecretUri string = ''

@description('Authentication mode for the app (parity default: demo).')
@allowed([
  'demo'
  'entra'
])
param authMode string = 'demo'

@description('Resource ID of a Log Analytics workspace for diagnostic settings. Empty disables diagnostics.')
param logAnalyticsWorkspaceId string = ''

var defaultHostname = '${name}.azurewebsites.net'

var baseAppSettings = [
  {
    name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
    value: appInsightsConnectionString
  }
  {
    name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
    value: '~3'
  }
  {
    name: 'XDT_MicrosoftApplicationInsights_Mode'
    value: 'recommended'
  }
  {
    name: 'WEBSITES_PORT'
    value: '3000'
  }
  {
    name: 'PORT'
    value: '3000'
  }
  {
    name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
    value: 'false'
  }
  {
    name: 'WEBSITE_RUN_FROM_PACKAGE'
    value: '0'
  }
  {
    name: 'NEXTAUTH_URL'
    value: 'https://${defaultHostname}'
  }
  {
    name: 'AUTH_MODE'
    value: authMode
  }
  // AI provider (Microsoft Foundry / Azure OpenAI) — managed identity, no keys.
  {
    name: 'AZURE_AI_ENDPOINT'
    value: aiEndpoint
  }
  {
    name: 'AZURE_AI_MODEL_DEPLOYMENT'
    value: aiModelDeployment
  }
  {
    name: 'AZURE_AI_API_VERSION'
    value: aiApiVersion
  }
  {
    name: 'AZURE_AI_AUTH'
    value: 'identity'
  }
  {
    name: 'AZURE_CLIENT_ID'
    value: managedIdentityClientId
  }
  // Storage (managed identity + user delegation SAS).
  {
    name: 'AZURE_STORAGE_ACCOUNT_URL'
    value: storageBlobEndpoint
  }
  {
    name: 'AZURE_STORAGE_CONTAINER'
    value: storageContainerName
  }
]

var databaseAppSettings = empty(databaseUrlSecretUri) ? [] : [
  {
    name: 'DATABASE_URL'
    value: '@Microsoft.KeyVault(SecretUri=${databaseUrlSecretUri})'
  }
]

resource app 'Microsoft.Web/sites@2024-04-01' = {
  name: name
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    keyVaultReferenceIdentity: managedIdentityId
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appCommandLine: appCommandLine
      alwaysOn: alwaysOn
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      healthCheckPath: '/api/health'
      appSettings: concat(baseAppSettings, databaseAppSettings)
    }
  }
}

resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsWorkspaceId)) {
  name: 'to-log-analytics'
  scope: app
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
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

output id string = app.id
output name string = app.name
output defaultHostname string = app.properties.defaultHostName
output url string = 'https://${app.properties.defaultHostName}'
