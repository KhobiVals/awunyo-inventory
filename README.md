<<<<<<< HEAD
# NEXUS POS — Point of Sale & Inventory System

A modern, full-stack Point of Sale and Inventory Management System built with React.

## Project Structure

This project has been restructured from a monolithic single file into a well-organized, modular architecture:

```
src/
├── components/          # Reusable UI components
│   ├── Icon.jsx        # SVG icon component
│   ├── Sidebar.jsx     # Navigation sidebar
│   ├── Notification.jsx # Toast notifications
│   └── DashboardView.jsx # Dashboard view component
├── data/               # Static data and constants
│   ├── products.js     # Product inventory data
│   ├── customers.js    # Customer data
│   ├── sales.js        # Sales transaction data
│   └── constants.js    # Categories and suppliers
├── hooks/              # Custom React hooks
│   └── usePOS.js       # POS logic and state management
├── styles/             # CSS styles
│   └── global.css      # Global styles and CSS variables
├── App.jsx             # Main application component
└── index.js            # Application entry point
```

## Features

- **Dashboard**: Overview of sales, revenue, stock alerts, and top products
- **Point of Sale**: Product search, cart management, customer selection
- **Inventory Management**: Stock tracking, low stock alerts
- **Sales History**: Transaction records and reporting
- **Customer Management**: Customer profiles and loyalty points
- **Reports**: Analytics and business insights
- **Settings**: Dark mode toggle and system configuration

## Technologies Used

- **React**: Frontend framework
- **JavaScript (ES6+)**: Programming language
- **CSS**: Styling with CSS variables for theming
- **SVG**: Inline SVG icons

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture Benefits

- **Modularity**: Components are separated by concern
- **Reusability**: Components can be easily reused
- **Maintainability**: Easier to debug and update individual parts
- **Scalability**: New features can be added without affecting existing code
- **Readability**: Code is organized and self-documenting

## Data Structure

The application uses mock data stored in separate files:
- Products with inventory, pricing, and supplier information
- Customer profiles with loyalty points
- Sales transactions with detailed item breakdowns
- Constants for categories and suppliers

## Future Enhancements

- Backend API integration
- Database persistence
- User authentication
- Real-time inventory updates
- Barcode scanning
- Receipt printing
- Multi-store support
=======
# awunyo-inventory
Multitenant POS
>>>>>>> 547ec6307ac3bc3ded727799956dd03e579e6814
