variable "region" {
  description = "AWS region."
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Name prefix / tag for created resources."
  type        = string
  default     = "hmb"
}

variable "instance_type" {
  description = "EC2 instance type. t3.small (2 GB) is the practical minimum for the frontend build."
  type        = string
  default     = "t3.small"
}

variable "root_volume_gb" {
  description = "Root EBS volume size in GB (holds Docker images + DB + uploads)."
  type        = number
  default     = 30
}

# --- Access ---
variable "ssh_public_key" {
  description = "Optional OpenSSH PUBLIC key to install (contents of ~/.ssh/id_ed25519.pub). Leave empty and Terraform generates a keypair, writing the private key to <project_name>-key.pem."
  type        = string
  default     = ""
}

variable "ssh_ingress_cidr" {
  description = "CIDR allowed to SSH (port 22). Lock this to your IP, e.g. 1.2.3.4/32."
  type        = string
  default     = "0.0.0.0/0"
}

# --- App source ---
variable "repo_url" {
  description = "Git repo to deploy, e.g. https://github.com/you/hmb.git"
  type        = string
}

variable "repo_branch" {
  description = "Branch to deploy."
  type        = string
  default     = "main"
}

variable "github_token" {
  description = "Optional token for a PRIVATE repo (used in the clone URL). Leave empty for public repos."
  type        = string
  default     = ""
  sensitive   = true
}

# --- Secrets that must be supplied ---
variable "pin_encryption_key" {
  description = "Fernet key for nurse-PIN encryption. Generate: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
  type        = string
  sensitive   = true
}

variable "smtp_host" {
  description = "SMTP server host."
  type        = string
  default     = "smtp-relay.brevo.com"
}

variable "smtp_port" {
  description = "SMTP server port (587 = STARTTLS)."
  type        = number
  default     = 587
}

variable "smtp_user" {
  description = "SMTP username (Brevo SMTP login, e.g. xxxx@smtp-brevo.com)."
  type        = string
  default     = "b52bb7001@smtp-brevo.com"
}

variable "smtp_password" {
  description = "Gmail app password (16 chars, no spaces)."
  type        = string
  sensitive   = true
}

variable "smtp_from" {
  description = "From header for outgoing mail."
  type        = string
  default     = "HelloMamaBetter <hellomamabetter@gmail.com>"
}

variable "mapbox_token" {
  description = "Mapbox public token (baked into the frontend at build time)."
  type        = string
  sensitive   = true
}
