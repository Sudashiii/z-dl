# z-ui Bruno Notes

- Do not commit credentials in `collection.bru` or shared environment files.
- Put local secrets in a private file under an `environments` folder:
  - Example template: `Z-UI/environments/local.private.example.bru`
  - Your personal file: `Z-UI/environments/local.private.bru`
- Files matching `*.private.bru` are ignored via `z-ui-bruno/.gitignore`.

If you already accidentally added a secret in a tracked file, remove it and rotate that credential.
