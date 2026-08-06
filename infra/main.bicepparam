using './main.bicep'

// Core
param location = 'eastus2'
param resourceGroupName = 'rg-phoenixai-demo'
param namePrefix = 'phoenixai'

// Ownership / cost tags — fill in for your environment.
param owner = ''
param costCentre = ''

// Reused Microsoft Foundry / Azure OpenAI (gpt-4o vision deployment).
param foundryResourceGroupName = 'rg-aisgemini-dev'
param foundryAccountName = 'aif-yfjw6y'
param foundryModelDeployment = 'gpt-4o'
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
param alertEmailAddress = ''
