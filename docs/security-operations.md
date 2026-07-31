# Security and operations checklist

- Store secrets in a secret manager; never bake `.env.production` into images.
- Rotate cookie, JWT and super-admin credentials after any exposure.
- Terminate TLS at a trusted proxy and enable HSTS there and in API headers.
- Use an explicit CORS allowlist and trusted proxy configuration.
- Review rate-limit thresholds per endpoint and add stricter auth limits before public launch.
- Validate every uploaded file and move production assets to private S3/R2 with controlled public delivery.
- Alert on repeated login failures, payment/webhook failures, worker failures and tenant-isolation denials.
- Test database restores and order/inventory reconciliation before launch.
- Run dependency and container vulnerability scanning in the deployment platform.
