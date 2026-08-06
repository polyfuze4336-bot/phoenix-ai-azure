metadata description = 'Managed identity (user-assigned) used by the Phoenix AI App Service to reach Key Vault, Storage and the Foundry model — no secrets/keys.'

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
