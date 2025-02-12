# Church Service Roster Manager

A modern, React-based web application for managing church service rosters and scheduling. This application helps churches efficiently manage their service schedules, member assignments, and special events while respecting various scheduling rules and member preferences.

## Features

### Member Management
- Add and manage church members
- Track member preferences and availability
- Assign roles (Head of Department)
- Mark members with special considerations (has children, service time preferences)
- Track service history and participation

### Service Scheduling
- Automated schedule generation for multiple services
- Support for up to three services per Sunday
- Fair distribution of assignments
- Respect member preferences and constraints
- Maintain consistent service times for members
- Ensure minimum and maximum member requirements per service

### Special Events
- Create and manage special events that affect regular scheduling
- Support for various recurrence patterns:
  - Monthly events
  - Bimonthly events
  - Quarterly events
  - Yearly events
  - Custom intervals
- Flexible event configuration (number of services, date ranges)
- Active/inactive event toggling

### Scheduling Rules
- Configurable minimum/maximum members per service
- Customizable minimum days between member assignments
- Optional preference settings:
  - Respect member service time preferences
  - Prioritize members with children for later services
  - Maintain consistent service times

### Data Management
- Import/export functionality for roster data
- Persistent storage using localStorage
- Sample data loading for testing
- Backup and restore capabilities

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/church-roster-manager.git
```

2. Navigate to the project directory:
```bash
cd church-roster-manager
```

3. Install dependencies:
```bash
npm install
# or
yarn install
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

### Quick Start with Sample Data
The application provides a simple way to test its functionality using sample data:

1. In the Admin Dashboard, click the "Load Sample Data" button in the top right corner
2. Confirm the prompt to load sample member data
3. The system will populate with test members and their preferences

To clear the sample data (or any existing data):
1. Go to the Settings tab
2. Scroll down to "Data Management"
3. Click "Clear All Data"
4. Confirm the prompt to reset all data

### Setting Up Members
1. Navigate to the Members tab
2. Click "Add Member"
3. Fill in member details:
   - Name
   - Head of Department status
   - Children status
   - Service preferences

### Configuring Scheduling Rules
1. Go to the Scheduling Rules tab
2. Set your preferred:
   - Minimum/maximum members per service
   - Minimum days between services
   - Preference settings

### Managing Special Events
1. Access the Settings tab
2. Click "Add Event"
3. Configure event details:
   - Name
   - Date range
   - Number of services
   - Recurrence pattern (if applicable)

### Generating Schedules
The system automatically generates schedules based on:
- Current member roster
- Configured scheduling rules
- Active special events
- Member availability and preferences

## Technical Details

### Built With
- React
- Next.js
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- shadcn/ui Components

### Project Structure
- `/components` - React components
- `/lib` - Utility functions and types
- `/styles` - CSS and styling files
- `/public` - Static assets

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
