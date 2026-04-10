This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The repo is ready for Vercel deployment. Use the default Next.js framework detection, or rely on the included [vercel.json](vercel.json).

Before deploying, set these environment variables in the Vercel project settings:

- `NEXT_PUBLIC_API_URL`: base URL of your backend API.
- `NEXT_PUBLIC_FILE_UPLOAD_ENDPOINT`: upload endpoint used by the frontend.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: optional captcha site key.

Use [.env.example](.env.example) as the template for local and production values.

If your backend is deployed separately, make sure it is reachable from Vercel over HTTPS and that CORS allows requests from the frontend domain.
