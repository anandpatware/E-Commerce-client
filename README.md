# Northstar Market storefront

React + Vite frontend for the E-Commerce backend services.

## Run

1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the API Gateway URL.
3. Run `npm install`.
4. Run `npm run dev`.

The frontend expects the gateway product routes under `/api/products` and auth routes under `/api/users/auth`. Product creation requires a JWT containing the `Admin` role.

## Email verification

The learning service sends verification links through SMTP. For local development, configure a provider in the terminal before starting the learning service. Gmail requires 2-Step Verification and a 16-character App Password:

```bash
cd ../learning
export Smtp__Enabled=true
export Smtp__Host=smtp.gmail.com
export Smtp__Port=587
export Smtp__UseSsl=true
export Smtp__Username=your-email@gmail.com
export Smtp__Password=your-gmail-app-password
export Smtp__FromAddress=your-email@gmail.com
export Smtp__FromName="Northstar Market"
export Smtp__FrontendBaseUrl=http://localhost:5173
dotnet run
```

After registration, open the link in the email. It opens the React app at `/verify-email`, which calls the gateway verification endpoint and then offers login. The resend action uses the same SMTP configuration. When SMTP is disabled, the service logs the verification link as a development fallback.
