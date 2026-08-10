output "public_ip" {
  description = "Public IPv4 of the instance."
  value       = aws_instance.this.public_ip
}

output "app_url" {
  description = "Open this once bootstrap finishes (~3-6 min after apply)."
  value       = "http://${aws_instance.this.public_ip}"
}

output "ssh_command" {
  description = "SSH in (use the private key matching ssh_public_key)."
  value       = "ssh ubuntu@${aws_instance.this.public_ip}"
}

output "db_password" {
  description = "Auto-generated Postgres password (also written on the box)."
  value       = random_password.postgres.result
  sensitive   = true
}
