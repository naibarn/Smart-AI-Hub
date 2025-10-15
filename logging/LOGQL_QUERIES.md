# LogQL Queries for Smart AI Hub

This document contains common LogQL queries used for monitoring and troubleshooting the Smart AI Hub infrastructure.

## Basic Queries

### View All Logs
```
{job=~".+"}
```

### View Logs for Specific Service
```
{job="auth-service"}
```

### Filter by Log Level
```
{level="error"}
{level="warn"}
{level="info"}
{level="debug"}
```

### Filter by Multiple Services
```
{job=~"auth-service|core-service|mcp-server"}
```

## Time-based Queries

### Recent Logs (Last 5 Minutes)
```
{job=~".+"} |= "" | timestamp() > now() - 5m
```

### Logs in Time Range
```
{job=~".+"} |= "" | timestamp() >= "2023-10-15T09:00:00Z" and timestamp() <= "2023-10-15T10:00:00Z"
```

## Text Search Queries

### Search for Specific Text
```
{job=~".+"} |= "database connection"
```

### Search for Multiple Terms
```
{job=~".+"} |= "error" |= "database"
```

### Exclude Specific Text
```
{job=~".+"} != "health check"
```

## Parsed Log Queries

### Parse JSON Logs
```
{job=~".+"} | json
```

### Parse Logfmt Logs
```
{job=~".+"} | logfmt
```

### Extract Specific Fields
```
{job=~".+"} | json | level="error" | message =~ ".*database.*"
```

## HTTP Request Analysis

### HTTP Request Logs
```
{} |= "HTTP Request" | logfmt
```

### Request Duration Analysis
```
{} |= "HTTP Request" | logfmt | unwrap duration
```

### Slow Requests (>1s)
```
{} |= "HTTP Request" | logfmt | unwrap duration > 1000
```

### Request Rate by Service
```
sum(rate({job=~".+"} |= "HTTP Request"[5m])) by (job)
```

### Request Duration Percentiles
```
histogram_quantile(0.50, sum(rate({} |= "HTTP Request" | unwrap duration [5m])) by (le))
histogram_quantile(0.95, sum(rate({} |= "HTTP Request" | unwrap duration [5m])) by (le))
histogram_quantile(0.99, sum(rate({} |= "HTTP Request" | unwrap duration [5m])) by (le))
```

### HTTP Status Code Distribution
```
sum(count_over_time({} |= "HTTP Request" | logfmt | statusCode != "" [1h])) by (statusCode)
```

### 4xx Error Rate
```
sum(rate({} |= "HTTP Request" | logfmt | statusCode =~ "4.."[5m])) / sum(rate({} |= "HTTP Request"[5m])) * 100
```

### 5xx Error Rate
```
sum(rate({} |= "HTTP Request" | logfmt | statusCode =~ "5.."[5m])) / sum(rate({} |= "HTTP Request"[5m])) * 100
```

## Error Analysis

### Error Rate Calculation
```
(sum(rate({level="error"}[5m])) / sum(rate({job=~".+"}[5m]))) * 100
```

### Error Rate by Service
```
(sum(rate({level="error"}[5m])) by (job) / sum(rate({job=~".+"}[5m])) by (job)) * 100
```

### Top Error Messages
```
topk(10, sum(count_over_time({level="error"}[1h])) by (message))
```

### Database Errors
```
{level="error"} |= "database" | logfmt
```

### Authentication Failures
```
{level="warn"} |= "Security" |= "failed" | logfmt
```

## Performance Analysis

### Request Duration Distribution
```
sum(rate({} |= "HTTP Request" | unwrap duration [5m])) by (job)
```

### Slowest Requests
```
{} |= "HTTP Request" | logfmt | unwrap duration | sort by duration desc | limit 10
```

### Average Request Duration by Service
```
avg(rate({} |= "HTTP Request" | unwrap duration [5m])) by (job)
```

## User Activity Analysis

### Activity by User
```
sum(count_over_time({userId!=""}[1h])) by (userId)
```

### Actions by User
```
{userId="user123"} | logfmt | message =~ ".*action.*"
```

### Failed Login Attempts
```
{level="warn"} |= "Security" |= "failed" |= "login" | logfmt
```

## Service-specific Queries

### Auth Service
```
{job="auth-service"} | logfmt | level="error"
{job="auth-service"} |= "Security" | logfmt
```

### Core Service
```
{job="core-service"} | logfmt | message =~ ".*credit.*"
{job="core-service"} |= "payment" | logfmt
```

### MCP Server
```
{job="mcp-server"} | logfmt | message =~ ".*connection.*"
{job="mcp-server"} |= "provider" | logfmt
```

### Analytics Service
```
{job="analytics-service"} | logfmt | message =~ ".*processing.*"
{job="analytics-service"} |= "event" | logfmt
```

### Webhook Service
```
{job="webhook-service"} | logfmt | message =~ ".*delivery.*"
{job="webhook-service"} |= "webhook" | logfmt
```

### API Gateway
```
{job="api-gateway"} | logfmt | statusCode =~ "4..|5.."
{job="api-gateway"} |= "HTTP Request" | logfmt | unwrap duration > 1000
```

## Alerting Queries

### High Error Rate
```
(sum(rate({level="error"}[5m])) / sum(rate({job=~".+"}[5m]))) * 100 > 5
```

### No Logs Received
```
absent_over_time({job=~".+"}[5m])
```

### Service Down
```
absent_over_time({job="auth-service"}[5m])
```

### Database Connection Issues
```
sum(rate({level="error"} |= "database" |= "connection"[5m])) > 0
```

## Aggregation Queries

### Log Volume by Hour
```
sum(count_over_time({job=~".+"}[1h])) by (job)
```

### Error Distribution by Service
```
sum(count_over_time({level="error"}[1h])) by (job)
```

### Top Log Sources
```
topk(10, sum(count_over_time({job=~".+"}[1h])) by (job))
```

## Advanced Queries

### Correlate Errors with Requests
```
{level="error"} | logfmt | requestId = `req_123`
{} |= "HTTP Request" | logfmt | requestId = `req_123`
```

### Trace User Journey
```
{userId="user123"} | logfmt | sort by timestamp asc
```

### Find Related Errors
```
{level="error"} | logfmt | error =~ ".*connection.*" | line_format "{{.service}}: {{.message}}"
```

## Troubleshooting Queries

### Find Recent Errors
```
{level="error"} | timestamp() > now() - 1h | logfmt
```

### Check Service Health
```
{job=~".+"} |= "health" | logfmt
```

### Investigate Slow Performance
```
{} |= "HTTP Request" | logfmt | unwrap duration > 500 | sort by duration desc
```

### Find Failed Operations
```
{level="error"} |= "failed" | logfmt
```

## Query Optimization Tips

1. **Use specific time ranges**: Limit queries to relevant time periods
2. **Filter early**: Apply job and level filters before text searches
3. **Use regex efficiently**: Simple string matches are faster than regex
4. **Limit result sets**: Use `limit` and `topk` for large result sets
5. **Parse once**: Parse logs at the beginning of the query chain

## Query Examples for Common Issues

### Database Connection Pool Exhaustion
```
{level="error"} |= "database" |= "connection" |= "pool" | logfmt
```

### Memory Leaks
```
{level="warn"} |= "memory" |= "usage" | logfmt | unwrap usage > 0.8
```

### Rate Limiting
```
{level="warn"} |= "rate" |= "limit" | logfmt
```

### Authentication Token Issues
```
{level="warn"} |= "token" |= "expired" | logfmt
```

### External Service Failures
```
{level="error"} |= "external" |= "service" | logfmt