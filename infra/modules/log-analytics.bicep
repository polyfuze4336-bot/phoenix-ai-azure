metadata description = 'Log Analytics workspace — central log/metric sink for Phoenix AI (Application Insights workspace-based).'

@description('Workspace name.')
param name string

@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('Data retention in days (demo default 30).')
@minValue(30)
@maxValue(730)
param retentionInDays int = 30

@description('Daily ingestion cap in GB. -1 = no cap.')
param dailyQuotaGb int = -1

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: dailyQuotaGb
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

output id string = workspace.id
output name string = workspace.name
output customerId string = workspace.properties.customerId
