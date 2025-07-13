# WSJF Prioritization Calculator

A comprehensive web application for prioritizing software initiatives using the Weighted Shortest Job First (WSJF) methodology. This tool helps teams make data-driven decisions about feature development priorities.

## Features

- **Interactive WSJF Calculation**: Calculate Cost of Delay and Job Size for initiatives
- **Customizable Weights**: Adjust the relative importance of different Cost of Delay components
- **Real-time Ranking**: See initiatives automatically ranked by WSJF score
- **PDF Export**: Generate professional reports for stakeholders
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Web Component Support**: Can be embedded in other applications

## Cost of Delay Components

1. **User Value (UV)**: Impact on training effectiveness and user efficiency
2. **Time Criticality (TC)**: Deadline dependencies and event-driven requirements
3. **Risk Reduction (RR)**: Mitigation of operational and technical risks
4. **Compliance/Regulatory (CR)**: Legal, regulatory, and SLA requirements

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd wsjf-prioritization-calculator

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run build:webcomponent` - Build as web component
- `npm run build:css` - Build CSS for web component

## Deployment

### Vercel (Recommended)

This application is optimized for Vercel deployment:

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Deploy automatically on every push

### Manual Deployment

```bash
npm run build
npm run start
```

## Usage

1. **Set Weights**: Adjust the Cost of Delay component weights based on your organization's priorities
2. **Add Initiatives**: Enter initiative details including name and scores for each component
3. **Review Rankings**: View automatically calculated WSJF scores and rankings
4. **Export Report**: Generate PDF reports for stakeholder communication

## WSJF Formula

```
WSJF = Cost of Delay / Job Size

Cost of Delay = (User Value × UV Weight) + 
                (Time Criticality × TC Weight) + 
                (Risk Reduction × RR Weight) + 
                (Compliance × CR Weight)
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Build**: TSup for web components
- **Deployment**: Vercel

## Web Component Usage

Build the web component and embed it in any website:

```bash
npm run build:webcomponent
```

```html
<script src="./dist/wsjf-webcomponent.iife.js"></script>
<wsjf-app></wsjf-app>
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on the Weighted Shortest Job First methodology from SAFe (Scaled Agile Framework)
- Built with modern web technologies for optimal performance and user experience
