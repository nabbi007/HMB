locals {
  name = var.project_name
}

# Latest Ubuntu 22.04 LTS AMI (Canonical, published via SSM public parameters).
data "aws_ssm_parameter" "ubuntu" {
  name = "/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id"
}

# Auto-generated secrets (special=false keeps them safe inside a DB URL / env files).
resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "random_password" "pin_index" {
  length  = 40
  special = false
}

resource "aws_key_pair" "this" {
  key_name   = "${local.name}-key"
  public_key = var.ssh_public_key
}

resource "aws_security_group" "this" {
  name        = "${local.name}-sg"
  description = "HMB: web (80/443) public, SSH restricted"

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS (for later TLS)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_ingress_cidr]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-sg" }
}

resource "aws_instance" "this" {
  ami                    = data.aws_ssm_parameter.ubuntu.value
  instance_type          = var.instance_type
  key_name               = aws_key_pair.this.key_name
  vpc_security_group_ids = [aws_security_group.this.id]

  # Spot. Omitting max_price caps at the on-demand price.
  instance_market_options {
    market_type = "spot"
    spot_options {
      spot_instance_type             = "one-time"
      instance_interruption_behavior = "terminate"
    }
  }

  root_block_device {
    volume_size           = var.root_volume_gb
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    repo_url           = var.repo_url
    repo_branch        = var.repo_branch
    github_token       = var.github_token
    postgres_user      = "hmb"
    postgres_password  = random_password.postgres.result
    postgres_db        = "hmb"
    jwt_secret         = random_password.jwt.result
    pin_encryption_key = var.pin_encryption_key
    pin_index_key      = random_password.pin_index.result
    smtp_user          = var.smtp_user
    smtp_password      = var.smtp_password
    smtp_from          = var.smtp_from
    mapbox_token       = var.mapbox_token
  })

  # Re-run bootstrap if the script changes (replaces the instance).
  user_data_replace_on_change = true

  tags = { Name = "${local.name}-app" }
}
