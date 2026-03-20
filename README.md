# MySocietyDetails SuperAdmin Panel

A comprehensive admin panel for managing societies and admins in the MySocietyDetails application. Built with Next.js and Supabase.

## Features

- **Authentication**: Secure login system for superadmins
- **Dashboard**: Overview of system statistics
- **Society Management**: Create, view, edit, and delete societies
- **Admin Management**: Create admin accounts and assign them to societies
- **Responsive Design**: Works on mobile, tablet, and desktop devices
- **Dark/Light Mode**: Theme support for user preference

## Technologies Used

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Design Components**: Custom UI components with modern design
- **Backend**: Supabase for authentication and database
- **State Management**: React Hooks for local state management

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd superadmin-panel
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Environment Setup:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

Ensure your Supabase project has the following tables:

1. **societies**:
   - id (uuid, primary key)
   - name (text)
   - address (text)
   - created_at (timestamp with time zone)
   - updated_at (timestamp with time zone)

2. **admins**:
   - id (uuid, primary key, references auth.users.id)
   - username (text, unique)
   - society_id (uuid, references societies.id)
   - created_at (timestamp with time zone)
   - updated_at (timestamp with time zone)

3. **superadmins**:
   - id (uuid, primary key, references auth.users.id)
   - username (text, unique)
   - created_at (timestamp with time zone)
   - updated_at (timestamp with time zone)

## Usage

1. Log in with your superadmin credentials
2. Use the dashboard to get an overview of your system
3. Create societies through the Societies page
4. Create admin accounts through the Admins page or through a specific society

## Deployment

This project can be deployed using Vercel or any other Next.js hosting platform:

```bash
npm run build
# or
yarn build
```

## License

This project is licensed under the MIT License.

## Contact

For any questions or support, please contact the development team.
