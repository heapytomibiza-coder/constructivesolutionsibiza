# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public issue.**

Instead, contact us directly:

📧 **Email:** security@constructivesolutionsibiza.com

Please include:

- A clear description of the vulnerability
- Steps to reproduce (if applicable)
- The potential impact
- Any suggested fix (optional but appreciated)

We will acknowledge your report within **48 hours** and aim to provide a resolution or mitigation plan within **7 days**.

## Scope

This policy covers:

- The web application at [constructivesolutionsibiza.lovable.app](https://constructivesolutionsibiza.lovable.app)
- All backend services, APIs, and database access controls
- Authentication and authorization flows
- Data storage and file access

## Security Posture

This project enforces security at multiple layers:

- **Row-Level Security (RLS)** on all database tables — access is scoped to authenticated users and their own data
- **SECURITY DEFINER functions** for role checks (`has_role()`, `is_admin_email()`) to prevent recursive policy issues
- **Private storage buckets** with scoped access policies for sensitive files (dispute evidence, progress photos)
- **CI pipeline** with automated smoke, interaction, and type-checking tests on every change
- **93+ versioned SQL migrations** with full audit trail

## Responsible Disclosure

We follow responsible disclosure practices. If you report a valid vulnerability:

- We will not take legal action against you
- We will credit you (if desired) once the fix is deployed
- We will keep you informed of progress

Thank you for helping keep this platform safe for clients and professionals.
