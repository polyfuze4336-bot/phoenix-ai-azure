metadata description = 'User-assigned managed identity used by Phoenix AI to reach ACR, Key Vault, Storage and Azure AI without local credentials.'

@description('User-assigned managed identity name.')
param name string

@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: name
  location: location
  tags: tags
}

output id string = uami.id
output name string = uami.name
output principalId string = uami.properties.principalId
output clientId string = uami.properties.clientId
