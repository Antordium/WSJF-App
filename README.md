# WSJF Calculator - Deployment Guide

## Overview
This is a Weighted Shortest Job First (WSJF) prioritization calculator with PDF export functionality, built with Next.js and deployable to Vercel.

## New Features Added
- **PDF Export**: Export prioritized initiatives to a professional PDF report
- **Enhanced UI**: Export button in the header with loading states
- **Data Validation**: Ensures data integrity before export
- **Professional Reports**: Includes summary statistics, weights configuration, and formatted tables

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Vercel will automatically detect it's a Next.js app
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts
4. Your app will be deployed automatically

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm start
```

## Project Structure
```
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main WSJF calculator component
│   │   ├── layout.tsx            # App layout
│   │   ├── globals.css           # Global styles
│   │   ├── wsjf-webcomponent.tsx # Web component version
│   │   └── wsjf-app-style.ts     # Compiled styles
│   ├── utils/
│   │   └── pdfExport.ts          # PDF generation utilities
│   └── types/
│       └── pdf.d.ts              # TypeScript declarations
├── public/                       # Static assets
├── dist/                         # Built web component files
└── ...config files
```

## Features

### WSJF Calculator
- **Cost of Delay Components**: User Value, Time Criticality, Risk Reduction, Compliance
- **Weighted Scoring**: Customizable weights for each component
- **Story Point Estimation**: Fibonacci sequence for job sizing
- **Real-time Prioritization**: Automatic WSJF calculation and ranking
- **Interactive UI**: Tooltips, sliders, and responsive design

### PDF Export
- **Professional Reports**: Clean, formatted PDF output
- **Summary Statistics**: Highest, lowest, and average WSJF scores
- **Configuration Details**: Current weights and settings
- **Detailed Tables**: All initiatives with complete scoring breakdown
- **Automatic Naming**: Timestamped filenames for easy organization

## Technical Details

### Dependencies Added
- `jspdf`: PDF generation library
- `jspdf-autotable`: Table formatting for PDFs

### Browser Compatibility
- Modern browsers with ES2017+ support
- PDF generation works client-side (no server required)
- Responsive design for mobile and desktop

### Performance
- Client-side rendering for fast interactions
- In-memory storage (session-based)
- Optimized bundle with code splitting

## Deployment Configuration

### Vercel Settings
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Environment Variables
No environment variables are required for basic functionality.

### Build Optimizations
- Tree shaking for smaller bundles
- PDF libraries loaded on-demand
- Tailwind CSS purging for optimal CSS size

## Usage

### Basic Workflow
1. **Set Weights**: Adjust the importance of each Cost of Delay component
2. **Add Initiatives**: Enter your software initiatives with scores
3. **Review Rankings**: See real-time WSJF prioritization
4. **Export Report**: Generate PDF for stakeholders

### Scoring Guidelines
- **User Value (1-10)**: Impact on end users and training effectiveness
- **Time Criticality (1-10)**: Urgency and event dependencies
- **Risk Reduction (1-10)**: Risk mitigation and opportunity enablement
- **Compliance (1-10)**: Regulatory and SLA requirements
- **Job Size (Fibonacci)**: Development effort estimation

## Troubleshooting

### Common Issues
1. **PDF Export Fails**: Ensure you have initiatives added
2. **Deployment Issues**: Check Node.js version (18+ required)
3. **Build Errors**: Clear `.next` folder and rebuild

### Support
For issues specific to this implementation, check:
- Browser console for JavaScript errors
- Network tab for failed requests
- Vercel dashboard for deployment logs

## Web Component Version
The app also builds as a web component for embedding in other applications:
```bash
npm run build:webcomponent
```

This generates files in the `dist/` folder that can be included in any HTML page.
