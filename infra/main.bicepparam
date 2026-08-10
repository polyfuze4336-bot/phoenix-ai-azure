using './main.bicep'

// Core
param location = 'eastus2'
param resourceGroupName = 'rg-phoenixai-bfgs-demo'
param namePrefix = 'phoenixai'

// Ownership / cost tags — fill in for your environment.
param owner = ''
param costCentre = ''

// Environment-owned Microsoft Foundry / Azure AI Services (gpt-4o vision deployment).
param foundryModelDeployment = 'gpt-4o'
param foundryModelVersion = '2024-11-20'
param foundryModelCapacity = 10
param aiApiVersion = '2024-10-21'

// PostgreSQL
param postgresAdminLogin = 'phoenixadmin'
// Never commit a real password. Supply at deploy/what-if time via the PG_ADMIN_PASSWORD
// environment variable (falls back to empty, which is only valid for local what-if runs
// where a value is exported in the shell first).
param postgresAdminPassword = readEnvironmentVariable('PG_ADMIN_PASSWORD', '')
param postgresDatabaseName = 'phoenix'

// App
param authMode = 'demo'
param containerImageTag = 'latest'
param deployContainerApp = true
param containerMinReplicas = 0
param containerMaxReplicas = 3
param alertEmailAddress = ''
