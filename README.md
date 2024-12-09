# OneLetterbox

A modern newsletter reader built with React and TypeScript. This application provides a clean, intuitive interface for reading and managing your newsletter subscriptions.

## Project Structure

```
oneletterbox/
├── src/
│   ├── components/
│   │   ├── Article/
│   │   │   ├── Article.tsx      # Main article display component
│   │   │   └── ArticleMeta.tsx  # Article metadata component
│   │   ├── Sidebar/
│   │   │   ├── Category.tsx     # Newsletter category component
│   │   │   ├── NewsletterItem.tsx # Individual newsletter item
│   │   │   └── Sidebar.tsx      # Sidebar navigation component
│   │   └── Layout.tsx           # Main layout component
│   ├── App.tsx                  # Root application component
│   ├── main.tsx                 # Application entry point
│   ├── App.css                  # Component-specific styles
│   └── index.css                # Global styles
├── index.html                   # HTML entry point
├── package.json                 # Project dependencies and scripts
└── README.md                    # Project documentation
```

## Features

- Clean, modern interface
- Sidebar navigation with categories
- Newsletter list with unread indicators
- Article view with metadata
- Responsive layout
- TypeScript for type safety

## Technology Stack

- React 18
- TypeScript
- Vite (for build tooling)
- Modern CSS (with CSS Modules)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd oneletterbox
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building for Production

To create a production build:
```bash
npm run build
```

The built files will be available in the `dist` directory.

## Development

The project uses a component-based architecture with TypeScript for type safety. Components are organized by feature, with shared components in the components directory.

### Code Style

- TypeScript for type safety
- Functional components with hooks
- CSS modules for styling
- ESLint for code quality
- Prettier for code formatting 