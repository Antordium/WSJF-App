# PCTE Business Value Voting Tool v5.0

A real-time, multi-user **Weighted Shortest Job First (WSJF)** prioritization platform with Signal Strength scoring. Built for PCTE stakeholders to collaboratively vote on feature business value, with persona-weighted scoring and cross-service consensus analysis.

![Version](https://img.shields.io/badge/version-5.0-blue) ![Next.js](https://img.shields.io/badge/Next.js-16.0.8-black) ![React](https://img.shields.io/badge/React-19.2-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Firebase](https://img.shields.io/badge/Firebase-RTDB-orange)

## What is WSJF?

WSJF (Weighted Shortest Job First) is a prioritization model used in SAFe (Scaled Agile Framework) to sequence work for maximum economic benefit.

### Formula

```
WSJF = Cost of Delay / Number of Sprints

Cost of Delay = (Adjusted UV x weight) + (Adjusted TC x weight) + (RR x weight) + (CR x weight)

Adjusted UV = Weighted UV Average x Signal Strength
Adjusted TC = Raw TC Average x Signal Strength
```

**Factors (1-5 scale):**
- **UV** (User Value): Business value delivered to users -- scored by voters
- **TC** (Time Criticality): Urgency and time sensitivity -- scored by voters
- **RR** (Risk Reduction): Risk mitigation and opportunity enablement -- scored by admin
- **CR** (Compliance/Regulatory): Regulatory or compliance requirements -- scored by admin
- **Sprints** (1-6): Estimated effort in sprint iterations -- set by admin

### Signal Strength Algorithm

Signal Strength adjusts raw vote averages based on vote quality (capped at 2.0x):

```
Signal Strength = min(2.0, Volume x Service Spread x Persona Spread x Consensus)

Volume Factor   = min(1.2, max(0.85, 0.8 + log2(voters) x 0.1))
Service Spread  = min(1.6, 1.0 + 0.15 x (unique_services - 1))
Persona Spread  = min(1.5, 1.0 + 0.1 x (unique_personas - 1))
Consensus Bonus = max(1.0, min(1.15, 1.0 + 0.15 x (1 - StdDev/Mean)))
```

Features with votes from more services, more persona types, and higher agreement receive stronger signal amplification.

### Persona Weights

Votes are weighted by persona to reflect stakeholder influence:

| Persona | Weight |
|---------|--------|
| USCYBERCOM | 1.4x |
| Operator | 1.3x |
| Trainer | 1.1x |
| Content Author / Range Engineer | 1.0x |
| Leadership | 0.9x |
| Platform Maintainer | 0.85x |

## Features

### Real-Time Multi-User Voting
- Admin creates a session with features to score
- Voters join via session code or QR code
- Real-time vote collection using Firebase Realtime Database
- Voters score UV and TC per feature on a guided 1-5 scale

### Admin Controls (`/admin`)
- Create voting sessions with title, PIN, and feature list
- Each feature captures: name, Jira number, problem statement, developer team
- Start/lock/advance voting per feature
- Enter admin scores (RR, CR, Sprints) per feature
- Configure WSJF weights
- Calculate final WSJF with Signal Strength
- Export results with full voter demographics (service & persona breakdown)

### Voter Experience (`/vote`)
- Register with persona, service/sub-unified command, rank, and name
- Lobby view while waiting for admin to open voting
- Score UV and TC per feature with contextual definitions
- Progress indicator (Feature X of Y)
- Automatic reconnection via localStorage voter ID

### Results Dashboard (`/results`)
- Results grouped by developer team with tab filtering
- Full metric breakdown: raw/adjusted UV, raw/adjusted TC, signal strength, RR, CR, Cost of Delay, sprints, WSJF
- Top 3 features color-coded per team (green, orange, darker orange)
- Export to PDF and CSV

### Standalone Calculator (`/`)
- Local WSJF calculator with localStorage persistence (no Firebase required)
- Multi-voter UV scoring with persona/service tracking
- Signal Strength visualization
- Customizable factor weights (1-10)
- Add/edit/delete initiatives

### Export Reports
- **PDF**: Landscape report with branded header, team-grouped tables, color-coded top 3, and voter demographics page (admin only)
- **CSV**: Full data export with signal strength metrics and voter demographics appendix (admin only)
- Voter demographic data (service/persona breakdown) included only in admin exports for traceability

### Additional
- Dark mode with system preference detection and localStorage persistence
- Responsive design for desktop, tablet, and mobile
- QR code generation for easy session sharing
- Contextual tooltips and scoring definitions throughout

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16.0.8** | React framework with static export (`output: 'export'`) |
| **React 19.2** | UI rendering |
| **TypeScript 5.x** | Type safety |
| **Firebase Realtime Database** | Real-time session, voter, and vote persistence |
| **Tailwind CSS 4.x** | Utility-first styling with custom theme system |
| **jsPDF + jspdf-autotable** | PDF report generation |
| **qrcode.react** | QR code generation for session joining |
| **Lucide React** | Icon library |
| **GitHub Pages** | Static site deployment via GitHub Actions |

## Project Structure

```
WSJF-App/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Standalone WSJF Calculator
│   │   ├── admin/page.tsx          # Admin session management
│   │   ├── vote/page.tsx           # Voter interface
│   │   ├── results/page.tsx        # Results dashboard
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Tailwind + custom styles
│   └── lib/
│       ├── types.ts                # Shared TypeScript interfaces
│       ├── algorithm.ts            # Signal Strength & WSJF calculation
│       ├── firebase.ts             # Firebase RTDB integration
│       ├── constants.ts            # Personas, services, weights, scoring definitions
│       ├── export-utils.ts         # CSV & PDF export with demographics
│       └── theme.ts                # Dark/light mode theme
├── .github/workflows/
│   └── deploy-gh-pages.yml         # GitHub Pages CI/CD
├── next.config.mjs                 # Next.js config (static export, basePath)
├── package.json
└── tsconfig.json
```

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm
- Firebase project with Realtime Database enabled

### Environment Variables

Create `.env.local` with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

The standalone calculator (`/`) works without Firebase. The multi-user voting features (`/admin`, `/vote`, `/results`) require Firebase.

### Installation

```bash
git clone https://github.com/Antordium/WSJF-App.git
cd WSJF-App

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

```bash
npm run build    # Static export to ./out
```

## How to Use

### Multi-User Voting Session

**Admin:**
1. Go to `/admin` and create a new session (title + PIN + feature list)
2. Share the session code or QR code with voters
3. Start voting when voters have joined
4. Lock & advance through each feature
5. After all features are voted on, enter admin scores (RR, CR, Sprints) per feature
6. Configure weights and calculate WSJF
7. Export results (PDF/CSV with voter demographics)

**Voter:**
1. Go to `/vote` and enter the session code
2. Register with persona, service, rank, and name
3. Wait in lobby for admin to start
4. Score UV and TC for each feature as it opens
5. View results when admin publishes them

### Standalone Calculator
1. Go to `/` to use the local calculator
2. Add initiatives with name and description
3. Score UV (multi-voter), TC, RR, CR, and estimate sprints
4. Adjust factor weights as needed
5. Export ranked results to PDF or CSV

## Deployment

### GitHub Pages (Current)

Automated via GitHub Actions on push to configured branches. Firebase secrets are injected as GitHub Actions secrets.

The workflow:
1. Builds with `GITHUB_PAGES=true` (sets `/WSJF-App` basePath)
2. Exports static site to `./out`
3. Deploys via `actions/deploy-pages@v4`

### Manual Deployment

```bash
npm run build
# Deploy ./out directory to any static hosting provider
```

## Firebase Data Model

```
sessions/{sessionId}/
├── meta/          # title, status, currentFeatureIndex, adminPin, createdAt
├── features/      # {id, name, jiraNumber, problemSolved, developerTeam, order, votingOpen, rr, cr, sprints}
├── voters/        # {id, persona, service, rank, lastName, firstName, joinedAt}
├── votes/         # votes/{featureId}/{voterId} → {uv, tc, timestamp}
└── results/       # Calculated FeatureResult objects per feature
```

Session data persists indefinitely in Firebase and can be queried after the fact.

## Scoring Guidelines

### User Value (UV)
| Score | Definition |
|-------|-----------|
| 1 | Minimal user benefit; purely technical or internal |
| 2 | Small improvement; affects a limited group or edge case |
| 3 | Moderate value; addresses a common user need |
| 4 | High value; significant impact on mission readiness |
| 5 | Major value; transforms user capability or removes critical blocker |

### Time Criticality (TC)
| Score | Definition |
|-------|-----------|
| 1 | No time pressure; do anytime |
| 2 | Some urgency; within the next few PIs |
| 3 | Moderate criticality; within 1-2 PIs |
| 4 | Urgent; must deliver this PI or face impact |
| 5 | Severe criticality; miss this PI = mission failure or penalty |

### Risk Reduction (RR)
| Score | Definition |
|-------|-----------|
| 1 | No risk mitigation; does not affect reliability |
| 2 | Minor risk reduction; addresses low-probability issues |
| 3 | Moderate risk reduction; improves system stability |
| 4 | High risk reduction; prevents major outage scenario |
| 5 | Prevents high-impact failure; eliminates existential risk |

### Compliance/Regulatory (CR)
| Score | Definition |
|-------|-----------|
| 1 | No compliance requirement |
| 2 | Internal policy alignment; nice to have |
| 3 | Recommended by audit; should address |
| 4 | Required by regulation or SLA within defined timeline |
| 5 | Mandated by law, DoD directive, or immediate SLA breach risk |

## Services / Sub-Unified Commands

USCYBERCOM, ARCYBER, FLTCYBER, MARFORCYBER, AFCYBER, CGCYBER, CNMF, DCDC, Other

## Version History

### v5.0 (Current) - Signal Strength & Multi-User Voting
- Real-time multi-user voting platform with Firebase Realtime Database
- Admin/voter role separation with PIN-authenticated sessions
- Signal Strength algorithm: adjusts scores based on vote volume, service spread, persona spread, and consensus
- Persona-weighted scoring (USCYBERCOM 1.4x through Platform Maintainer 0.85x)
- QR code session sharing
- Voter demographics in admin exports (service & persona breakdown)
- Developer team grouping in results and exports
- Results dashboard with team-based tab filtering
- Jira number and problem statement tracking per feature

### v4.0
- Changed factor scoring from Fibonacci to 1-5 scale
- Renamed "Job Size" to "Number of Sprints" (1-6)
- Enhanced PDF export with professional design
- Added CSV export functionality

### v3.x
- Legacy scoring system

## License

Internal use license. Not for public distribution.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- Real-time data by [Firebase](https://firebase.google.com/)
- Icons by [Lucide](https://lucide.dev/)
- PDF generation by [jsPDF](https://github.com/parallax/jsPDF)
- QR codes by [qrcode.react](https://github.com/zpao/qrcode.react)
- Inspired by SAFe Framework WSJF model

---

*Prioritize smarter, deliver faster.*
