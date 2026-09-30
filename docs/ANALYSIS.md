# NONOBJECT: PRD and reference analysis

The current editorial refinement supersedes the original page sequence and bottle interaction described below. See [VISUAL-REFINEMENT.md](VISUAL-REFINEMENT.md) for the simplified journey and new hero art.

## Brand decision
NONOBJECT is the chosen working studio name, as authorized by the user. It expresses the service's central idea: a product image should convey more than an isolated object. The orange object and chrome loop make that idea physical. No registered trademark or legal entity is claimed.

## What the PRD means for the website
The offer is research-led Amazon listing imagery, with other marketplaces as extensions. The main conversion is a structured enquiry, not checkout. The design makes room for spectacle, then settles into clear process, commercial terms and an editable brief. It never invents clients, outcomes, ratings, business identifiers or revenue claims.

The initial workspace contained the PRD and scroll-craft package, with no existing application, framework, portfolio photos or separate attached reference images. The five linked references were inspected through their Lapa screenshots and descriptions. They were not copied into the finished website.

## Reference observations and adaptations
| Reference | Observed in supplied reference | Adapted principle |
|---|---|---|
| [Josh Taylor](https://www.lapa.ninja/post/josh-taylor/) | Warm quiet canvas; small introduction; large product imagery; varied image sizes; compact explanatory text | Let images lead and keep the interface secondary. Use a generous, asymmetric portfolio composition. |
| [Sutéra](https://www.lapa.ninja/post/sutera/) | Isolated central objects, technical annotations, fine connecting lines and strong black typography | Treat the hero as a dimensional composition. Reveal meaningful labels around a product as its story develops. |
| [Connected Earth](https://www.lapa.ninja/post/connected-earth/) | Sparse pale canvas, a central globe and orbiting objects, very large title and quiet information rows | Contrast monumental objects with small, legible information. Leave space between the visual event and practical detail. |
| [Lowercase](https://www.lapa.ninja/post/lowercase/) | Dense blue linework, a strong studio voice, archival image groupings and clearly structured links | Build a recognizable visual vocabulary and a gallery with editorial rhythm. Do not import its dense desktop layout into a mobile enquiry form. |
| [The Content Architecture](https://www.lapa.ninja/post/the-content-architecture/) | Cream and black chapter changes, big plainspoken headings and dense supporting material | Alternate expressive visual sections with straightforward substance. Keep the commercial explanation readable. |

These observations concern the screenshot compositions. No claim is made that their live motion implementations were replicated or fully audited.

## Proposed identity, implemented for review
- Paper #F2F1EC, ink #20201E, bright orange #FF5A1F, muted supporting neutrals.
- Archivo Black for the oversized wordmark; neutral Arial/Helvetica text for readable service information.
- Independent image planes overlap typography; the recognizable bottle-and-chrome silhouette returns in the interactive study and close.
- Generated imagery is used for the hero and interactive visual study. Three separate galleries now show actual supplied studio work: an Amazon sieve listing, a baking-dish listing, and a serving-tray listing. Client names and performance claims remain absent because they were not supplied.
- No autoplay video or audio. Native scrolling is retained. The supplied scroll-craft engine is copied unchanged.

## Signature and motion
The custom “studio contact sheet” grammar combines a spatial title composition, a quiet explanation, one pinned story-building stage, an asymmetric gallery and a practical enquiry ending. Scroll assembles a colored field, frame, detail crop and annotations around the object. Buyer-question buttons change the explanation and carry the selected direction into the brief.

The hero uses independent subject and foreground-caption movement. The page also uses a pin, image wipe and sequential process entrances: four device families without applying one treatment to every section. Compact phones get a different spatial layout. Reduced-motion mode exposes the completed composition without pinning or parallax.

## Current enquiry flow
The first-contact form is intentionally a short brief: contact details, project need, one product-count range (including 100+), platforms, available materials, timeline and optional context or files. It does not ask visitors to add products one by one, and it does not calculate a quote before review. SKU, EAN, specifications, image quantities and formats are gathered after personal contact. Optional uploads accept up to six JPG/PNG/WebP/PDF files of 10 MB each. Official contact details, legal text, production hosting and notification credentials remain owner-provided configuration. GitHub Pages is a static demo and cannot receive enquiries.

## Functional implementation
Vite with semantic HTML and plain JavaScript, plus an Express service. The same Zod schema validates the brief in the browser and on the server. The API validates optional attachments, saves them outside the public build, and stores a durable enquiry record with notification status. Published pricing remains informational, with final scope and price confirmed personally.

Local storage is a functioning first implementation, not a claim of Google Drive integration. A production host needs a persistent private volume or a new storage adapter. SMTP owner/client email and Telegram notification adapters are present but inactive without configuration. Preview saves never send messages. Legal notices and a public origin must be configured before public enquiries are enabled.
