# Hosting NONOBJECT on Vercel

Import `tolcotu/nonobject-studio` into Vercel and choose the repository root as the Root Directory. The included `vercel.json` selects Vite, installs with `npm ci`, builds with `npm run build:vercel`, and serves `dist`. No environment variables are needed for this static preview. Use Node.js 22 or a newer version supported by Vite.

## What is ready

The complete responsive website, image galleries, scroll effects and enquiry brief builder are included. Asset paths are built for the domain root. GitHub Pages retains its separate `npm run build:pages` build with `/nonobject-studio/` paths.

## Enquiry form

The Vercel build deliberately runs in **static preview mode**. It clearly tells visitors that nothing is sent to the studio. SEND PROJECT validates the form and offers a downloadable JSON brief. Selected attachments are listed by name only; their contents are not uploaded or included in the download.

The existing Express server stores enquiries on a local disk. It is not deployed by this static Vercel configuration. Before receiving real enquiries, connect a server endpoint with durable storage, attachment storage and email delivery, approve the privacy/legal copy, and test delivery and retry behaviour. Do not simply disable the preview flag: this deployment has no enquiry API.

## Local verification

Run `npm ci`, then `npm run build:vercel`. Preview with `npx vite preview --host 127.0.0.1`. Check that images load, gallery controls work and the form produces a downloadable brief without making API requests.

Configuration reference: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json).
