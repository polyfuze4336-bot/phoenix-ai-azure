metadata description = 'Azure Container App hosting the Phoenix AI Next.js standalone server with managed-identity access to ACR, Key Vault, Storage and Azure AI.'

@description('Container App name.')
param name string

@description('Azure region.')
param location string

@description('Resource tags.')
param tags object

@description('Container Apps managed environment resource ID.')
param environmentId string

@description('Fully qualified OCI image reference.')
param containerImage string

@description('Azure Container Registry login server.')
param registryServer string

@description('Resource ID of the user-assigned managed identity.')
param managedIdentityId string

@description('Client ID of the user-assigned managed identity.')
param managedIdentityClientId string

@description('Application Insights connection string.')
param appInsightsConnectionString string

@description('Azure AI account endpoint.')
param aiEndpoint string

@description('Azure AI model deployment name.')
param aiModelDeployment string

@description('Azure OpenAI API version.')
param aiApiVersion string = '2024-10-21'

@description('Blob endpoint of the storage account.')
param storageBlobEndpoint string

@description('Private blob container name.')
param storageContainerName string

@description('Key Vault secret URI for DATABASE_URL.')
param databaseUrlSecretUri string

@description('Authentication mode for the app.')
@allowed([
  'demo'
  'entra'
])
param authMode string = 'demo'

@description('Minimum number of active replicas. Zero enables scale-to-zero.')
@minValue(0)
param minReplicas int = 0

@description('Maximum number of active replicas.')
@minValue(1)
param maxReplicas int = 3

var appUrl = 'https://${name}.${reference(environmentId, '2024-03-01').defaultDomain}'

resource app 'Microsoft.App/containerApps@2024-03-01' = {
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
    environmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        allowInsecure: false
        clientCertificateMode: 'ignore'
        external: true
        targetPort: 3000
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
        transport: 'auto'
      }
      registries: [
        {
          identity: managedIdentityId
          server: registryServer
        }
      ]
      secrets: [
        {
          identity: managedIdentityId
          keyVaultUrl: databaseUrlSecretUri
          name: 'database-url'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'phoenixai'
          image: containerImage
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '3000'
            }
            {
              name: 'HOSTNAME'
              value: '0.0.0.0'
            }
            {
              name: 'NEXTAUTH_URL'
              value: appUrl
            }
            {
              name: 'AUTH_MODE'
              value: authMode
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsightsConnectionString
            }
            {
              name: 'NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsightsConnectionString
            }
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
            {
              name: 'AZURE_STORAGE_ACCOUNT_URL'
              value: storageBlobEndpoint
            }
            {
              name: 'AZURE_STORAGE_CONTAINER'
              value: storageContainerName
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/health/live'
                port: 3000
                scheme: 'HTTP'
              }
              failureThreshold: 3
              initialDelaySeconds: 10
              periodSeconds: 30
              timeoutSeconds: 5
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/health/ready'
                port: 3000
                scheme: 'HTTP'
              }
              failureThreshold: 3
              initialDelaySeconds: 10
              periodSeconds: 30
              timeoutSeconds: 10
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-concurrency'
            http: {
              metadata: {
                concurrentRequests: '20'
              }
            }
          }
        ]
      }
      terminationGracePeriodSeconds: 30
    }
  }
}

output id string = app.id
output name string = app.name
output fqdn string = app.properties.configuration.ingress.fqdn
output url string = 'https://${app.properties.configuration.ingress.fqdn}'