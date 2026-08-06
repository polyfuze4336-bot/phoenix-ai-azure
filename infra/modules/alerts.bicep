metadata description = 'Baseline operational alerts for the Phoenix AI App Service (HTTP 5xx and latency) wired to an action group.'

@description('Resource tags.')
param tags object

@description('Action group short name (max 12 chars).')
@maxLength(12)
param actionGroupShortName string = 'phoenixai'

@description('Action group name.')
param actionGroupName string = 'ag-phoenixai-ops'

@description('Optional email address to notify. Empty creates the action group with no receivers.')
param alertEmailAddress string = ''

@description('Resource ID of the App Service (web app) to monitor.')
param appServiceId string

@description('Enable the alert rules.')
param enableAlerts bool = true

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: actionGroupName
  location: 'global'
  tags: tags
  properties: {
    groupShortName: actionGroupShortName
    enabled: true
    emailReceivers: empty(alertEmailAddress) ? [] : [
      {
        name: 'ops-email'
        emailAddress: alertEmailAddress
        useCommonAlertSchema: true
      }
    ]
  }
}

resource http5xxAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: 'alert-phoenixai-http5xx'
  location: 'global'
  tags: tags
  properties: {
    description: 'Phoenix AI App Service is returning HTTP 5xx errors.'
    severity: 2
    enabled: true
    scopes: [
      appServiceId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Http5xx'
          metricNamespace: 'Microsoft.Web/sites'
          metricName: 'Http5xx'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: 'alert-phoenixai-response-time'
  location: 'global'
  tags: tags
  properties: {
    description: 'Phoenix AI App Service average response time is elevated.'
    severity: 3
    enabled: true
    scopes: [
      appServiceId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTime'
          metricNamespace: 'Microsoft.Web/sites'
          metricName: 'HttpResponseTime'
          operator: 'GreaterThan'
          threshold: 5
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

output actionGroupId string = actionGroup.id
