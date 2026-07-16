# Deployment commands for Rostr Contracts AWS backend
#
# Prerequisites:
#   - AWS CLI configured (`aws configure`)
#   - Terraform 1.7+ installed
#   - Python 3.12+ for Lambda runtime

# 1. Initialize Terraform
cd backend/terraform
terraform init

# 2. Plan (review resources)
terraform plan -var="db_password=YourSecurePassword123!"

# 3. Apply (provision everything)
terraform apply -var="db_password=YourSecurePassword123!" -auto-approve

# 4. Get outputs
terraform output

# 5. Deploy Lambda code (handled by archive_file in TF,
#    but for updates without infra changes):
cd ..
pip install -r requirements.txt -t ./package
cp -r app package/
cd package && zip -r ../terraform/lambda.zip . && cd ..
# Then: terraform apply -target=aws_lambda_function.api

# 6. Test the API
curl https://$(terraform -chdir=terraform output -raw api_stage_url)health

# 7. Frontend: point the Next.js app at the API
# Set in Vercel env vars:
#   NEXT_PUBLIC_API_URL=https://<cloudfront_domain>
