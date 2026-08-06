metadata description = 'Connects Phoenix AI to an EXISTING Microsoft Foundry / Azure OpenAI account by granting the app managed identity data-plane inference access. Deployed at the scope of the Foundry account resource group; does not modify the account.'

@description('Name of the existing Foundry / Azure OpenAI (Cognitive Services) account to reuse.')
param foundryAccountName string

@description('Principal (object) ID of the app user-assigned managed identity to grant access.')
param principalId string

@description('Built-in role to grant. Default: Cognitive Services OpenAI User (inference only, no management).')
param roleDefinitionId string = '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'

resource foundry 'Microsoft.CognitiveServices/accounts@2024-10-01' existing = {
  name: foundryAccountName
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
output endpoint string = foundry.properties.endpoint
