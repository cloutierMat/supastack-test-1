terraform {
  required_version = "1.6.5"

  backend "local" {
    path = "./terraform.tfstate"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.29.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      project = var.project_name
    }
  }
}
