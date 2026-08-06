metadata description = 'Linux App Service plan hosting the Phoenix AI Next.js Node application.'

@description('App Service plan name.')
param name string

@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('Plan SKU name (demo default B1).')
param skuName string = 'B1'

@description('Plan SKU tier.')
param skuTier string = 'Basic'

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuTier
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

output id string = plan.id
output name string = plan.name
