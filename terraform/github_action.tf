locals {
  known_thumbprints = [
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1b511abead59c6ce207077c0bf0e0043b1382612"
  ]
  github_org  = regex("(\\w+)/\\w+$", var.repo_url)[0]
  github_repo = regex("/(\\w+)$", var.repo_url)[0]
}

resource "aws_iam_openid_connect_provider" "github_oidc" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = local.known_thumbprints
}

data "aws_iam_policy_document" "github_oidc" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [resource.aws_iam_openid_connect_provider.github_oidc.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"

      values = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"

      values = ["repo:${local.github_org}/${local.github_repo}"]
    }
  }
}

resource "aws_iam_role" "web_pipeline" {
  name = "WEB-Pipeline-Role"
  inline_policy {
    name = "AllowWebResources"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Action = "s3:*"
          Resource = [
            module.s3_web_bucket.s3_bucket_arn,
            "${module.s3_web_bucket.s3_bucket_arn}/*"
          ]
        }
      ]
    })
  }
  assume_role_policy = data.aws_iam_policy_document.pipeline_oidc.json
}

resource "local_file" "github_action" {
  content = templatefile("${path.module}/templates/deployToS3.yml.tpl",
    {
      WEB_BUCKET  = local.bucket_name
      AWS_REGION  = var.aws_region
      ASSUME_ROLE = resource.aws_iam_role.web_pipeline.arn
  })
  filename = "../.github/workflows/deployToS3.yml"
}
