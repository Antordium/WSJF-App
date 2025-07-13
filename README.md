# WSJF Prioritization Calculator

A powerful Weighted Shortest Job First (WSJF) prioritization tool built with Next.js, TypeScript, and Tailwind CSS. This application helps agile teams prioritize features and initiatives by balancing Cost of Delay with Job Size estimates.

## Features

- **Interactive WSJF Calculator**: Score initiatives across multiple dimensions
- **Dynamic Weight Adjustment**: Customize the importance of each Cost of Delay component
- **PDF Export**: Generate professional reports of your prioritization matrix
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **In-Memory Storage**: Session-based data storage with no external dependencies
- **Real-time Calculations**: Instant WSJF score updates as you adjust values

## Cost of Delay Components

1. **User Value (UV)**: Impact on user satisfaction and training effectiveness
2. **Time Criticality (TC)**: Urgency based on deadlines and events
3. **Risk Reduction (RR)**: Mitigation of operational and technical risks
4. **Compliance/Regulatory (CR)**: Legal, regulatory, and SLA requirements

## Getting Started

### Prerequisites

- Node.js 18.18.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/wsjf-app.git
cd wsjf-app
