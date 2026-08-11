output "public_ip" {
  description = "Public IPv4 of the instance."
  value       = aws_instance.this.public_ip
}

output "app_url" {
  description = "Open this once bootstrap finishes (~3-6 min after apply)."
  value       = "http://${aws_instance.this.public_ip}"
}

output "ssh_command" {
  description = "SSH in."
  value = local.private_key_path != null ? (
    "ssh -i ${local.private_key_path} ubuntu@${aws_instance.this.public_ip}"
  ) : "ssh ubuntu@${aws_instance.this.public_ip}"
}

output "private_key_path" {
  description = "Path to the generated private key (null if you supplied your own public key)."
  value       = local.private_key_path
}

output "db_password" {
  description = "Auto-generated Postgres password (also written on the box)."
  value       = random_password.postgres.result
  sensitive   = true
}
