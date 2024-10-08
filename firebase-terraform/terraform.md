# Preparation

- Manage client_secret for google authentication and github authentication separately
- Create terraform.tfvars in advance and put secret key in it

```terraform.tfvars
oauth_client_secret_google=""
oauth_client_secret_github=""
```

# Commands

- Run the following command to update the staging environment

```
terraform init
terraform apply
```

terraform import google_identity_platform_config.default projects/one-pager-maker-production2

```

# Pricing plan

- If you don't use the Blaze plan, google_identity_platform_config and google_firebase_storage_bucket will fail
- Run the Blaze plan once, then switch back to the Spark plan. This doesn't cost anything for now

# Authentication

- The default for user account linking is "Link accounts with the same email address," but it has been changed to "Create multiple accounts for each identity provider." I don't know why.
- I don't know how to change the [settings](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/identity_platform_config) above...

# Cloud Firestore

- I changed the rules but I don't know the impact. The previous rules gave me a warning.

# Terraform And Gihub

When I apply Terraform using Github Actions, I get an error message saying `roles/resourcemanager.projectCreator` permission.

I don't know how to resolve this using a personal account, so I run it locally.
```
