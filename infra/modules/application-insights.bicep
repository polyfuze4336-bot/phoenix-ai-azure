metadata description = 'Application Insights (workspace-based) for Phoenix AI telemetry.'

@description('Application Insights component name.')
param name string

@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('Resource ID of the Log Analytics workspace backing this component.')
param logAnalyticsWorkspaceId string

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: name
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspaceId
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    DisableIpMasking: false
  }
}

output id string = appInsights.id
output name string = appInsights.name
output connectionString string = appInsights.properties.ConnectionString
