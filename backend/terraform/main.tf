# ─── Rostr Contracts — AWS Infrastructure ───
# Provisions: VPC, RDS PostgreSQL, Cognito, Lambda (FastAPI),
# API Gateway HTTP API, S3, CloudFront, Secrets Manager

terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ─── VARIABLES ──────────────────────────────────

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "rostr-contracts"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

# ─── VPC ────────────────────────────────────────

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "${var.app_name}-vpc" }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = { Name = "${var.app_name}-subnet-public-a" }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  tags = { Name = "${var.app_name}-subnet-public-b" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.app_name}-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "${var.app_name}-rt-public" }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# ─── SECURITY GROUP ─────────────────────────────

resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg"
  description = "Allow PostgreSQL access"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.app_name}-rds-sg" }
}

resource "aws_security_group" "lambda" {
  name        = "${var.app_name}-lambda-sg"
  description = "Lambda security group"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.app_name}-lambda-sg" }
}

# ─── RDS POSTGRESQL ─────────────────────────────

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet"
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

resource "aws_db_instance" "main" {
  identifier           = "${var.app_name}-db"
  engine               = "postgres"
  engine_version       = "16.3"
  instance_class       = "db.t4g.micro"
  allocated_storage    = 20
  storage_encrypted    = true
  db_name              = "contracts"
  username             = "postgres"
  password             = coalesce(var.db_password, random_password.db.result)
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot  = true
  publicly_accessible  = true
  tags = { Name = "${var.app_name}-db" }
}

# ─── S3 ─────────────────────────────────────────

resource "aws_s3_bucket" "outputs" {
  bucket = "${var.app_name}-outputs-${var.environment}"
  tags   = { Name = "${var.app_name}-outputs" }
}

resource "aws_s3_bucket" "templates" {
  bucket = "${var.app_name}-templates-${var.environment}"
  tags   = { Name = "${var.app_name}-templates" }
}

# ─── COGNITO ────────────────────────────────────

resource "aws_cognito_user_pool" "main" {
  name = "${var.app_name}-users"
  auto_verified_attributes = ["email"]
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }
  schema {
    name                = "name"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.app_name}-client"
  user_pool_id = aws_cognito_user_pool.main.id
  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  generate_secret = false
}

# ─── LAMBDA ─────────────────────────────────────

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../"
  output_path = "${path.module}/lambda.zip"
  excludes    = ["terraform", "__pycache__", "*.pyc", ".git"]
}

resource "aws_iam_role" "lambda" {
  name = "${var.app_name}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_bedrock" {
  name = "${var.app_name}-bedrock"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["bedrock:InvokeModel"]
      Resource = ["arn:aws:bedrock:${var.aws_region}::foundation-model/deepseek.deepseek-v3"]
    }]
  })
}

resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda.output_path
  function_name    = "${var.app_name}-api"
  role             = aws_iam_role.lambda.arn
  handler          = "main.handler"
  runtime          = "python3.12"
  timeout          = 30
  memory_size      = 256
  source_code_hash = data.archive_file.lambda.output_base64sha256

  environment {
    variables = {
      AWS_REGION           = var.aws_region
      COGNITO_USER_POOL_ID = aws_cognito_user_pool.main.id
      COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.main.id
      DB_HOST              = aws_db_instance.main.address
      DB_PORT              = "5432"
      DB_NAME              = aws_db_instance.main.db_name
      DB_USER              = aws_db_instance.main.username
      DB_PASSWORD          = aws_db_instance.main.password
      S3_OUTPUTS_BUCKET    = aws_s3_bucket.outputs.id
      S3_TEMPLATES_BUCKET  = aws_s3_bucket.templates.id
      BEDROCK_MODEL        = "deepseek.deepseek-v3"
      CORS_ORIGIN          = "*"
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_group_ids = [aws_security_group.lambda.id]
  }
}

# ─── API GATEWAY HTTP API ───────────────────────

resource "aws_apigatewayv2_api" "main" {
  name          = "${var.app_name}-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
  }
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "prod"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api.invoke_arn
}

resource "aws_apigatewayv2_route" "all" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ─── CLOUDFRONT ─────────────────────────────────

resource "aws_cloudfront_distribution" "main" {
  enabled = true
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "api"
    viewer_protocol_policy = "redirect-to-https"
    forwarded_values {
      query_string = true
      cookies { forward = "all" }
    }
  }
  origin {
    domain_name = replace(replace(aws_apigatewayv2_api.main.api_endpoint, "/^https?:///", ""), "/$/", "")
    origin_id   = "api"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  restrictions {
    geo_restriction { restriction_type = "none" }
  }
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  tags = { Name = "${var.app_name}-cdn" }
}
