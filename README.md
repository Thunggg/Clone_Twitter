# Clone Twitter Backend (Express + MongoDB/Mongoose, TypeScript)

A TypeScript Node.js backend built with Express.js 5 and Mongoose 8. Provides JWT-based authentication (register, login, logout), structured success/error responses, robust input validation, and a clean project architecture suitable for extending into a full social platform.

## Tech Stack
- Runtime: Node.js (TypeScript)
- Framework: Express.js v5
- Database: MongoDB Atlas, ODM: Mongoose v8
- Auth: JSON Web Tokens (jsonwebtoken)
- Validation: express-validator
- Hashing: bcrypt
- Env management: dotenv
- Tooling: eslint + prettier, nodemon, rimraf, tsc-alias

## Project Structure
```
clone-twitter/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                      # App entry (create Express app, mount routes, error handler)
│   ├── config/
│   │   └── db.config.ts             # MongoDB connection (mongoose.connect)
│   ├── constants/
│   │   ├── enum.ts                  # Enums for user verify status, token types
│   │   ├── errorCodes.ts            # Internal error codes
│   │   ├── httpStatus.ts            # HTTP status constants
│   │   └── messages.ts              # User-facing messages
│   ├── controllers/
│   │   └── users.controller.ts      # Register, login, logout controllers
│   ├── middlewares/
│   │   ├── error.middlewares.ts     # Global error handler (ApiError)
│   │   └── users.middlewares.ts     # Validation, access token & refresh token validators
│   ├── models/
│   │   ├── requests/
│   │   │   └── User.request.ts      # Request bodies & JWT payload types
│   │   └── schemas/
│   │       ├── User.schema.ts       # Mongoose user schema & model
│   │       └── RefreshToken.schema.ts # Refresh token schema & model
│   ├── routes/
│   │   └── users.routes.ts          # /users routes (register/login/logout)
│   ├── services/
│   │   └── users.service.ts         # Business logic (create user, sign tokens, checks)
│   ├── utils/
│   │   ├── ApiError.ts              # Error response structure
│   │   ├── ApiSuccess.ts            # Success response structure
│   │   ├── CustomErrors.ts          # Domain errors (AuthenticationError, ConflictError, ...)
│   │   ├── bcrypt.ts                # Hash/compare password
│   │   ├── handlers.ts              # wrapRequestHandler for async controllers
│   │   ├── jwt.ts                   # sign/verify JWT helpers
│   │   └── validation.ts            # express-validator wrapper
│   └── type.d.ts                    # Express Request augmentation (user, decoded tokens)
```

## TypeScript Configuration
- tsconfig.json
  - module: NodeNext, target: ES2023
  - outDir: dist
  - strict type checking enabled
  - baseUrl + path alias: `~/*` -> `src/*`
  - files: includes `src/type.d.ts` to augment Express `Request`

## Environment Variables
Provide a `.env` file with at least the following variables:
- `PORT` — server port (default 3000)
- `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` — MongoDB Atlas credentials & database name
- `JWT_SECRET` — secret key for signing/verifying JWTs
- `ACCESS_TOKEN_EXPIRES_IN` — e.g. `15m` or `3600s`
- `REFRESH_TOKEN_EXPIRES_IN` — e.g. `7d`
- `BCRYPT_SALT_ROUNDS` — optional, default `10`

Example `.env`:
```
PORT=3000
DB_USERNAME=your_user
DB_PASSWORD=your_password
DB_NAME=your_db
JWT_SECRET=super_secret_value
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
```

## NPM Scripts
- `npm run dev` — development mode with nodemon
- `npm run build` — clean dist, compile TS, fix path aliases
- `npm run start` — run compiled app (`dist/index.js`)
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run prettier` / `npm run prettier:fix` — Prettier

## API Overview
Base URL: `/`

### Auth Endpoints (Users)
1) Register — `POST /users/register`
- Request Body:
```
{
  "username": "string (2-50 chars)",
  "email": "valid email",
  "password": "strong password",
  "confirm_password": "must match password",
  "date_of_birth": "YYYY-MM-DD (ISO8601), must be before today"
}
```
- Behavior:
  - Validates inputs, checks unique `username` and `email`.
  - Hashes password and creates user.
  - Issues `access_token` and `refresh_token` and stores refresh token in DB.
- Success Response (201):
```
{
  "success": true,
  "code": 0,
  "message": "Register successfully",
  "status": 201,
  "data": {
    "_id": "...",
    "username": "...",
    "email": "...",
    "date_of_birth": "...",
    "verify": 0,
    "createdAt": "...",
    "updatedAt": "...",
    "access_token": "...",
    "refresh_token": "..."
  },
  "timestamp": "ISO string"
}
```

2) Login — `POST /users/login`
- Request Body:
```
{
  "email": "valid email",
  "password": "required (currently validated as strong)"
}
```
- Behavior:
  - Finds user by email, compares password.
  - Issues `access_token` and `refresh_token`, stores refresh token.
- Success Response (200/201):
```
{
  "success": true,
  "code": 0,
  "message": "Login successfully",
  "status": 200,
  "data": {
    "access_token": "...",
    "refresh_token": "..."
  },
  "timestamp": "ISO string"
}
```

3) Logout — `POST /users/logout`
- Headers:
  - `Authorization: Bearer <access_token>`
- Request Body:
```
{
  "refresh_token": "string"
}
```
- Behavior:
  - Validates both `access_token` (header) and `refresh_token` (body).
  - Deletes the provided refresh token from DB.
- Success Response (200):
```
{
  "success": true,
  "code": 0,
  "message": "Logout successfully",
  "status": 200,
  "data": null,
  "timestamp": "ISO string"
}
```

### JWT Details
- Algorithm: HS256
- Payload type (`TokenPayload`):
```
{
  "user_id": "string",
  "token_type": 0 | 1 | 2 | 3  // AccessToken, RefreshToken, ForgotPasswordToken, EmailVerifyToken
}
```
- Access token validator expects `Authorization: Bearer <token>` header.
- Refresh token validator verifies token and checks existence in DB.

## Validation Errors (ApiError)
Validation errors return HTTP 422 with shape:
```
{
  "success": false,
  "code": 1001,
  "message": "Validation error",
  "status": 422,
  "errors": [
    { "field": "email", "message": "Email is invalid", "value": "foo" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ],
  "timestamp": "ISO string"
}
```

Other errors are standardized (authentication, conflict, internal, etc.) using `ErrorCodes` and caught by the global `errorHandler`.

## Data Models (Mongoose)
- User (`users` collection):
  - Fields: `username`, `email`, `date_of_birth (Date)`, `password (hash)`, `bio`, `avatar`, `cover_photo`, `verify (enum)`, `email_verify_token`, `forgot_password_token`, timestamps.
  - Indexes: `username` (unique), `email` (unique).
- RefreshToken (`refresh_tokens` collection):
  - Fields: `token (String)`, `created_at (Date)`, `user_id (ObjectId)`.
  - Recommended: unique index on `token`, index on `user_id`.

## Response Wrappers
- Success: `ApiSuccess<T>` — ensures consistent success payload shape.
- Error: `ApiError` — consistent error payload with standardized codes and optional `errors[]` details.

## Development & Conventions
- Linting: ESLint v9 (typescript-eslint), run `npm run lint` / `lint:fix`.
- Formatting: Prettier, run `npm run prettier` / `prettier:fix`.
- Aliases: import using `~` path alias from `src` (e.g., `import { ... } from '~/utils/jwt'`).

## Running Locally
1) Install dependencies: `npm install`
2) Set up `.env` (see Environment Variables)
3) Development: `npm run dev`
4) Production build: `npm run build` then `npm start`

## Known Issues / Roadmap
- Login returns `201` (Created) in controller; prefer `200 OK`.
- Access token validator checks header key case-sensitively ("Authorization"); consider using `req.get('authorization')` to be robust.
- `isStrongPassword` on login is unnecessary; only `notEmpty` is required.
- Default error handler should prefer `INTERNAL` for unknown errors.
- Duplicate import and creation pattern in `users.service.ts`: simplify to `UserModel.create({...})`.
- Remove type import from `ms`; use plain string/number for `expiresIn`.
- Improve Mongoose typing using `InferSchemaType` for model/document types and align timestamp fields.
- Add `unique` index for refresh token and `default: Date.now` for `created_at`.
- Ensure `JWT_SECRET` is validated at boot; fail fast if missing.
- Prefer single initialization of dotenv (in app entry).

## License
ISC (default from package.json). Adjust as needed.