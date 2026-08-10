# Terraform — HMB on an AWS spot instance (eu-west-1)

Provisions one EC2 **spot** instance and, via cloud-init, installs Docker, clones your
repo, writes the env files, and runs `docker-compose.prod.yml` (web + api + db) — the
whole app on one box, same-origin, port 80.

## Prerequisites
- Terraform ≥ 1.5, AWS CLI configured with credentials that can create EC2/VPC resources.
- A **default VPC** in eu-west-1 (every new AWS account has one).
- Your app pushed to a Git repo that includes `docker-compose.prod.yml`.

## Use
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # fill in repo_url, ssh_public_key, secrets
terraform init
terraform apply
```
`apply` prints `app_url`. The stack builds on first boot, so give it **~3-6 minutes**
after apply before the site responds.

Then create an admin:
```bash
ssh ubuntu@<public_ip>
cd /opt/hmb
sudo docker compose -f docker-compose.prod.yml exec api \
  python scripts/create_admin.py --first-name Admin --last-name HMB \
  --email admin@hellomamabetter.com --phone +233XXXXXXXXX
```

## What you provide vs. what's generated
- **You provide:** `repo_url`, `ssh_public_key`, `pin_encryption_key`, `smtp_password`,
  `mapbox_token` (and ideally `ssh_ingress_cidr` = your IP).
- **Auto-generated:** Postgres password, `JWT_SECRET`, `PIN_INDEX_KEY` (see
  `terraform output`; the DB password is a sensitive output).

## Debugging the first boot
```bash
ssh ubuntu@<public_ip> 'sudo tail -f /var/log/hmb-bootstrap.log'
```

## ⚠️ This is all-spot — data is not durable
`instance_interruption_behavior = terminate` and the root volume is deleted on
termination. If AWS reclaims the instance, **the database and uploads are lost**. That's
the accepted trade-off "for now". Before anything important, dump the DB (see
`../../DEPLOY.md` → Backups). To harden later: persistent spot + stop behavior, a
dedicated data EBS volume, or a managed DB.

## Teardown
```bash
terraform destroy
```

## Notes
- `pin_encryption_key` must stay constant — changing it makes existing encrypted nurse
  PINs unreadable.
- Secrets are rendered into user-data and therefore into Terraform **state** — keep state
  private (ideally an encrypted S3 backend), don't commit `terraform.tfvars` or `*.tfstate`.
- HTTPS: see `../../DEPLOY.md` (needs a domain; Caddy in front of `web`).
