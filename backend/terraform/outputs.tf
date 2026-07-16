# Terraform outputs — connection strings and resource IDs

output "api_endpoint" {
  description = "API Gateway HTTP API endpoint"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "api_stage_url" {
  description = "Full API URL with stage"
  value       = "${aws_apigatewayv2_api.main.api_endpoint}prod/"
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "db_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.address
}

output "db_port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

output "s3_outputs_bucket" {
  description = "S3 bucket for generated contract outputs"
  value       = aws_s3_bucket.outputs.id
}

output "s3_templates_bucket" {
  description = "S3 bucket for contract templates"
  value       = aws_s3_bucket.templates.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}
