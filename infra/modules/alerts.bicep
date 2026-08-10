metadata description = 'Baseline operational alerts for Phoenix AI failed requests and latency, sourced from Application Insights.'

@description('Resource tags.')
param tags object

@description('Action group short name (max 12 chars).')
@maxLength(12)
param actionGroupShortName string = 'phoenixai'

@description('Action group name.')
param actionGroupName string = 'ag-phoenixai-ops'

@description('Optional email address to notify. Empty creates the action group with no receivers.')
param alertEmailAddress string = ''

@description('Resource ID of the Application Insights component to monitor.')
param appInsightsId string

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

resource failedRequestsAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = if (enableAlerts) {
  name: 'alert-phoenixai-failed-requests'
  location: 'global'
  tags: tags
  properties: {
    description: 'Phoenix AI is reporting failed HTTP requests.'
    severity: 2
    enabled: true
    scopes: [
      appInsightsId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'FailedRequests'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Count'
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
    description: 'Phoenix AI average request duration is elevated.'
    severity: 3
    enabled: true
    scopes: [
      appInsightsId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTime'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'requests/duration'
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
