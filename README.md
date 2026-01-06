# Bhargav Mantha - Portfolio

> **Iron Man Themed Interactive Portfolio** with scrollytelling experience

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://bhargavmantha.dev)
[![Built with React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://react.dev)
[![Powered by Vite](https://img.shields.io/badge/Vite-4.4-646CFF?logo=vite)](https://vitejs.dev)

## 🚀 Features

- **Scrollytelling Experience**: 120-frame image sequence animation synchronized with scroll
- **Iron Man HUD Theme**: Arc reactor loader, electric blue accents, and futuristic UI
- **Smooth Animations**: Powered by Framer Motion for buttery-smooth transitions
- **Responsive Design**: Optimized for all screen sizes and high-DPI displays
- **Interactive Navigation**: Floating nav bar with smooth scroll-to-section
- **Performance Optimized**: High-quality canvas rendering with device pixel ratio scaling

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Deployment**: Netlify / Vercel

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/BhargavMantha/portfolio.git
cd portfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

## 🎨 Project Structure

```
portfolio/
├── public/
│   ├── sequence/          # 120 Iron Man animation frames
│   ├── models/            # 3D models and assets
│   └── Bhargav_Mantha.pdf # Resume
├── src/
│   ├── components/
│   │   ├── scrollytelling/  # Scroll-based animations
│   │   ├── ui/              # Reusable UI components
│   │   └── Navigation.tsx   # Floating navigation bar
│   ├── hooks/             # Custom React hooks
│   ├── constants/         # Content and configuration
│   └── App.tsx           # Main application
└── ...
```

## 🌟 Key Components

### Scrollytelling
- **IronManScroll**: Main scroll container with image sequence
- **SectionOverlay**: Content sections (Hero, About, Experience, Projects, Contact)
- **Navigation**: Floating nav bar with active section tracking

### UI Components
- **ArcReactorLoader**: Custom loading animation
- High-quality canvas rendering with image smoothing

## 🔧 Configuration

### Environment Variables
Create a `.env` file for any environment-specific configuration:

```env
# Add your environment variables here
```

### Tailwind Theme
Custom Iron Man color palette defined in `tailwind.config.js`:
- `primary`: Dark background (#0a0a0a)
- `electric-blue`: Accent color (#00d4ff)
- `arc-reactor`: Gold highlights (#ffc107)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Bhargav Mantha**
- Website: [bhargavmantha.dev](https://bhargavmantha.dev)
- GitHub: [@BhargavMantha](https://github.com/BhargavMantha)
- LinkedIn: [bhargavmantha](https://linkedin.com/in/bhargavmantha)
- Blog: [dev.to/bhargavmantha](https://dev.to/bhargavmantha)

---

Built with ❤️ and ⚡ by Bhargav Mantha
