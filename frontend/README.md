# Frontend

See the repository README for complete setup. Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_API_URL` as needed, then run `npm ci` and `npm run dev`. The backend and PostgreSQL must be running for application data and authentication.

`npm run lint` and `npm run build` validate the app. Routes share the same view and use Next.js navigation, so browser history and direct route entry agree with the selected screen. No demo login or mock data is used by the application context.
