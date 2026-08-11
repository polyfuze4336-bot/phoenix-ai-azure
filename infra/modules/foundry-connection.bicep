metadata description = 'Provisions an environment-owned Azure AI Services account, gpt-4o model deployment, and managed-identity inference access for Phoenix AI.'

@description('Globally unique Azure AI Services account name.')
param name string

@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('Model deployment name consumed by the application.')
param modelDeploymentName string = 'gpt-4o'

@description('Pinned OpenAI model version.')
param modelVersion string = '2024-11-20'

@description('Deployment SKU.')
param modelSkuName string = 'GlobalStandard'

@description('Model capacity in thousands of tokens per minute.')
@minValue(1)
param modelCapacity int = 10

@description('Principal (object) ID of the app user-assigned managed identity to grant access.')
param principalId string

@description('Built-in role to grant. Default: Cognitive Services OpenAI User (inference only, no management).')
param roleDefinitionId string = '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'

resource foundry 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: name
  location: location
  tags: tags
  kind: 'AIServices'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: name
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
  }
}

resource modelDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  parent: foundry
  name: modelDeploymentName
  sku: {
    name: modelSkuName
    capacity: modelCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: modelVersion
    }
    raiPolicyName: 'Microsoft.Default'
    versionUpgradeOption: 'NoAutoUpgrade'
  }
}

resource inferenceRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(foundry.id, principalId, roleDefinitionId)
  scope: foundry
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionId)
  }
}

output accountId string = foundry.id
output accountName string = foundry.name
output endpoint string = foundry.properties.endpoint
output modelDeploymentName string = modelDeployment.name
