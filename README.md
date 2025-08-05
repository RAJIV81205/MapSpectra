# MapSpectra 🌍

An advanced geospatial visualization platform built with Next.js for interactive mapping and analysis.

## 🚀 Features

- Interactive map interface with custom controls
- Real-time geospatial data visualization
- Custom polygon drawing and management
- Timeline-based data analysis
- Region-specific analysis tools
- Save and load analysis configurations

## 🛠️ Tech Stack & Dependencies

### Core Dependencies
- **Next.js** (^15.4.5) - React framework
- **React** (^19.1.0) - UI library
- **React DOM** (^19.1.0) - React rendering for web

### Mapping & Visualization
- **Mapbox GL** (^3.14.0) - Advanced mapping library
- **@mapbox/mapbox-gl-draw** (^1.5.0) - Drawing tools for Mapbox GL
- **@types/leaflet-draw** (^1.0.12) - TypeScript definitions for Leaflet Draw

### UI Components & Utilities
- **lucide-react** (^0.536.0) - Beautiful & consistent icons
- **next-themes** (^0.4.6) - Theme management for Next.js
- **react-hot-toast** (^2.5.2) - Toast notifications
- **driver.js** (^1.3.6) - User onboarding and feature tours

### Development Tools
- **TypeScript** - Type safety and developer experience
- **TailwindCSS** - Utility-first CSS framework
- **ESLint** - Code linting and formatting

### Features Enabled by Dependencies
- 🗺️ Advanced mapping with Mapbox GL
- ✏️ Drawing and polygon creation with Mapbox GL Draw
- 📱 Responsive design
- 💫 Smooth notifications
- 🎯 Interactive user guides

## 📁 Project Structure

```
mapspectra/
├── app/                # Next.js app directory
├── components/         # React components
├── public/            # Static assets
└── types/            # TypeScript definitions
```

## 🚦 Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/RAJIV81205/MapSpectra.git
cd mapspectra
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

4. **Start development server**
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 💻 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Key Components
- `Map.tsx`: Core mapping functionality
- `Dashboard.tsx`: Main interface
- `Sidebar.tsx`: Control panel
- `TimelineSlider.tsx`: Temporal controls

## 🌐 Deployment

Deploy on Vercel:
1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📞 Support

For issues and feature requests, please use the GitHub issues tracker.
