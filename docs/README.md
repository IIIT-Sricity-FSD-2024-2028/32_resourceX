# Swagger Documentation

This folder contains the exported OpenAPI documentation for the NestJS backend.

## Files

- `swagger.json`
  - Generated OpenAPI document used for presentation, import into Swagger Editor, or sharing with evaluators.

## Live Swagger UI

Run the project from the repository root:

```bash
npm start
```

Then open:

- `http://localhost:3000/api/docs`

If port `3000` is already in use:

```bash
PORT=3001 npm start
```

Then open:

- `http://localhost:3001/api/docs`

## Regenerating the exported docs

From the repository root:

```bash
npm run swagger:generate
```

That updates:

- `docs/swagger.json`

## JWT Authentication

Use the standard authorization header in your client or Swagger UI when testing APIs:

- **Header**: `Authorization: Bearer <JWT-token>`

To get a token, send a `POST` request to `/api/auth/login` with user credentials.

### Roles and Users for Testing

The system has mock data with the following test credentials:

- **Requestor**: `ravichandrareacmecorp@gmail.com` / `12345678` (ID: `U1`)
- **Dept Head**: `pradhyumdhacmecorp@gmail.com` / `12345678` (ID: `U2`)
- **Registrar**: `harshatejrgacmecorp@gmail.com` / `12345678` (ID: `U3`)
- **Inventory Officer**: `yaswanthkumarioacmecorp@gmail.com` / `12345678` (ID: `U4`)
- **Maintenance Officer**: `kumarmaintmoacmecorp@gmail.com` / `12345678` (ID: `U4M`)
- **Procurement Officer**: `kumarprocpoacmecorp@gmail.com` / `12345678` (ID: `U4P`)
- **System Admin**: `yashwathsaacmecorp@gmail.com` / `12345678` (ID: `U5`)
- **Platform Owner**: `owner@resourcex.com` / `password` (ID: `OWN-001`)
- **Platform Employee**: `employee1@resourcex.com` / `password` (ID: `EMP-001`)
