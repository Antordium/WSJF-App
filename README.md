# WSJF Calculator v4.0

A modern, feature-rich **Weighted Shortest Job First (WSJF)** prioritization tool built with Next.js and React. Designed for SAFe/Agile teams to make data-driven prioritization decisions using the WSJF framework.

![WSJF Calculator](https://img.shields.io/badge/version-4.0-blue) ![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black) ![React](https://img.shields.io/badge/React-19.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 📊 What is WSJF?

WSJF (Weighted Shortest Job First) is a prioritization model used in SAFe (Scaled Agile Framework) to sequence work for maximum economic benefit. The formula calculates a priority score based on the **Cost of Delay** divided by the **job effort**.

### WSJF Formula

```
WSJF = Cost of Delay / Number of Sprints

Where Cost of Delay = (UV × weight) + (TC × weight) + (RR × weight) + (CR × weight)
```

**Factors:**
- **UV** (User Value): Business value delivered to users
- **TC** (Time Criticality): Urgency and time sensitivity
- **RR** (Risk Reduction): Risk mitigation and opportunity enablement
- **CR** (Compliance/Regulatory): Regulatory or compliance requirements

## ✨ Features

### v4.0 Updates (Latest)
- **Simplified Scoring**: All WSJF factors now use a clean 1-5 scale (previously Fibonacci 1,3,6,8,10)
- **Sprint-Based Estimation**: Changed from generic "Job Size" to "Number of Sprints" (1-6 range)
- **Enhanced PDF Export**: Beautiful, professional PDF reports with:
  - Branded header with blue gradient
  - Visual hierarchy and color-coded top 3 priorities
  - Summary statistics and weight configurations
  - Clean, modern table design
- **CSV Export**: Quick data export to CSV for spreadsheet analysis
- **Fixed Layout**: Slider descriptions no longer cause layout shifts
- **Improved Documentation**: Comprehensive inline code comments

### Core Features
- **Interactive Prioritization**: Score objectives across four WSJF factors
- **Customizable Weights**: Adjust importance of each factor (1-10 scale)
- **Automatic Ranking**: Real-time WSJF calculation and sorting
- **Dark Mode**: Toggle between light and dark themes
- **Dual Export Options**:
  - **PDF**: Professional reports with visual styling
  - **CSV**: Quick export for Excel/Google Sheets
- **Responsive Design**: Works on desktop, tablet, and mobile
- **In-Memory Storage**: No database required, session-based data
- **Tooltips & Help**: Contextual guidance for each factor

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone or download the repository
cd WSJF-App-WSJF-v3

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 How to Use

### 1. Configure Cost of Delay Weights (Optional)
Adjust the weights (1-10) for each WSJF factor based on your team's priorities:
- **User Value**: How much you value customer impact
- **Time Criticality**: Importance of deadlines
- **Risk Reduction**: Focus on risk mitigation
- **Compliance**: Priority of regulatory requirements

### 2. Add Objectives
For each objective/initiative:
1. Enter a descriptive name
2. Score each factor (1-5 scale):
   - **1**: Minimal impact
   - **2**: Minor impact
   - **3**: Moderate impact (default)
   - **4**: Significant impact
   - **5**: Major impact
3. Estimate **Number of Sprints** (1-6)
4. Click "Add Objective"

### 3. Review Prioritized List
- Objectives are automatically ranked by WSJF score (highest first)
- **Top 3** items are visually highlighted with colored badges:
  - 🟢 #1 - Green
  - 🟠 #2 - Orange
  - 🟠 #3 - Darker Orange
- View Cost of Delay and WSJF scores for each item

### 4. Export Results
- **Export to PDF**: Generate a professional report with branding and visual design
- **Export to CSV**: Download raw data for further analysis

## 🏗️ Technical Architecture

### Tech Stack
- **Framework**: Next.js 15.3.3 (React 19)
- **Language**: TypeScript 5.x
- **Styling**: Inline styles with theme system
- **Icons**: Lucide React
- **PDF Generation**: jsPDF with autoTable plugin
- **Build Tool**: Next.js built-in (SWC compiler)

### Project Structure
```
WSJF-App-WSJF-v3/
├── src/
│   └── app/
│       ├── page.tsx              # Main WSJF Calculator component
│       ├── layout.tsx             # Root layout
│       ├── wsjf-app-style.ts     # Web component styles
│       └── wsjf-webcomponent.tsx # Web component wrapper
├── public/                        # Static assets
├── package.json                   # Dependencies & scripts
└── README.md                      # This file
```

### Key Components

#### Main Application (`page.tsx`)
- **WSJFApp**: Main application component
- **ScoringSlider**: Reusable slider for factor scoring
- **DarkModeToggle**: Theme switcher
- **Tooltip**: Help text overlay
- **ConfigPanel**: Storage mode display

#### State Management
- **initiatives**: Array of all objectives
- **weights**: Cost of Delay factor weights
- **newInitiative**: Form state for adding objectives
- **isDarkMode**: Theme preference (persisted to localStorage)

#### WSJF Calculation (useMemo)
```typescript
WSJF = (UV×weight_uv + TC×weight_tc + RR×weight_rr + CR×weight_cr) / sprints
```

Automatically recalculates when:
- Initiatives change
- Weights are adjusted

## 🎨 Scoring Guidelines

### User Value (UV)
- **1**: Minimal user benefit, purely technical
- **2**: Minor convenience or slight improvement
- **3**: Moderate efficiency improvement
- **4**: Significant value or workflow improvement
- **5**: Major value, eliminates substantial manual effort

### Time Criticality (TC)
- **1**: No time pressure, can be delivered anytime
- **2**: Minor preference for earlier delivery
- **3**: Moderate time pressure
- **4**: High criticality, affects business events
- **5**: Severe criticality, major business impact

### Risk Reduction (RR)
- **1**: No known risk mitigation
- **2**: Reduces minor operational inefficiencies
- **3**: Moderate risk reduction
- **4**: Significantly reduces operational risk
- **5**: Prevents high-impact development failure

### Compliance/Regulatory (CR)
- **1**: No compliance requirement
- **2**: Good to have for future compliance
- **3**: Addresses emerging compliance need
- **4**: Required for upcoming audit or SLA
- **5**: Mandated by law/regulation, severe consequences

### Number of Sprints
Estimate how many sprints (iterations) are needed to complete the work:
- **1 sprint**: Small, quick win
- **2-3 sprints**: Medium effort
- **4-5 sprints**: Larger initiative
- **6 sprints**: Major undertaking

## 🌙 Dark Mode

The application features a fully-implemented dark mode:
- Toggle via button in header
- Preference saved to localStorage
- Respects system dark mode preference on first load
- All UI elements adapt to theme

## 📤 Export Formats

### PDF Export
Professional reports include:
- Branded header with blue gradient
- Generation timestamp
- Cost of Delay weights summary
- Color-coded ranking table
- Visual highlighting of top 3 priorities
- Formatted for printing

### CSV Export
Simple comma-separated format with headers:
```
Rank, Objective, UV, TC, RR, CR, Sprints, Cost of Delay, WSJF Score
```

## 🚢 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Deploy (zero configuration needed)

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

The app will run on port 3000 by default.

### Environment Variables
No environment variables required! The app uses in-memory storage.

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Code Structure
The codebase is organized with clear section headers:
- **Constants & Scoring Scales**: Score arrays and ranges
- **Scoring Definitions**: Descriptive text for each level
- **Theme Configuration**: Dark/light mode colors
- **UI Components**: Reusable React components
- **Main Application**: Core WSJF calculator logic
- **Export Functions**: PDF and CSV generation
- **WSJF Calculation**: Score computation with useMemo

All functions include JSDoc comments explaining purpose and parameters.

## 📝 Version History

### v4.0 (Current)
- Changed factor scoring from Fibonacci to 1-5 scale
- Renamed "Job Size" to "Number of Sprints" (1-6)
- Enhanced PDF export with professional design
- Added CSV export functionality
- Fixed slider layout shift issues
- Improved code documentation

### v3.x
- Previous versions (legacy scoring system)

## 🤝 Contributing

This is an internal tool, but suggestions are welcome:
1. Test the application
2. Report issues or suggest features
3. Submit feedback

## 📄 License

Internal use license. Not for public distribution.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- PDF generation by [jsPDF](https://github.com/parallax/jsPDF)
- Inspired by SAFe Framework WSJF model

## 📞 Support

For questions or issues:
- Check this README first
- Review the inline tooltips in the app
- Contact the development team

---

**Made with ❤️ for Agile Teams**

*Prioritize smarter, deliver faster.*
