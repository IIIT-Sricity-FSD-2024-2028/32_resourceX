# Lab 2 React - ResourceX Profile Conversion

This folder contains a complete React implementation of the **User Profile Feature** from the `ResourceX` platform. This conversion has been built as a standalone development folder (`react-frontend`) to run in parallel with the NestJS backend and legacy static frontend, ensuring zero breakage.

---

## 1. Converted Feature & Component Structure

We selected the **User Profile Page** (`profile.html` / `profile.js`) for React conversion due to its interactive form validation, password strength indicators, and setting toggles.

### Component Tree
* **`App`** ([src/App.jsx](src/App.jsx)): The root container holding the state for the profile user, fetching data, handling API requests, and managing notifications (Toasts).
  * **`Sidebar`** ([src/components/Sidebar.jsx](src/components/Sidebar.jsx)): Displays the left sidebar navigation, including the return link.
  * **`AppHeader`** ([src/components/AppHeader.jsx](src/components/AppHeader.jsx)): Renders the top search bar, user notifications, avatar icon, and profile dropdown menu.
  * **`AvatarHeader`** ([src/components/AvatarHeader.jsx](src/components/AvatarHeader.jsx)): Shows the top banner card containing the profile picture avatar, user's full name, and role.
  * **`AccountInfo`** ([src/components/AccountInfo.jsx](src/components/AccountInfo.jsx)): Displays the core user details (User ID, Department, Email, and Name) with inline name validation and edit options.
  * **`Preferences`** ([src/components/Preferences.jsx](src/components/Preferences.jsx)): Renders preference settings (e.g., Push Notifications toggle switch).
  * **`SecuritySettings`** ([src/components/SecuritySettings.jsx](src/components/SecuritySettings.jsx)): Renders the change password forms, complete with a reactive password strength meter and form rules validation.

---

## 2. Technical Details

### A. Props Usage (Data Flow Downwards)
The Parent component (`App.jsx`) holds the main state (`user` object) and passes data down to its children using props:
* The parent passes `user.role` to `<Sidebar />`.
* The parent passes `user.name` and `user.role` to `<AppHeader />` and `<AvatarHeader />`.
* The parent passes `user.id`, `user.department`, `user.email`, and `user.name` to `<AccountInfo />`.
* The parent passes `user.preferences.notifications` to `<Preferences />`.

### B. Callback Functions (Child-to-Parent Communication)
To communicate state changes upwards, children trigger callback functions passed down as props by the parent:
* **`onNameChange` callback**: Passed to `<AccountInfo />`. When the user types inside the enabled name input, the child component calls this callback to notify the parent of the input changes in real-time.
* **`onToggleNotifications` callback**: Passed to `<Preferences />`. When the checkbox toggle is switched, it invokes this callback with the boolean state.
* **`onUpdatePassword` callback**: Passed to `<SecuritySettings />`. When local password criteria and password match checks pass, the child triggers this callback to send the change password API requests.

### C. Lifted State
The state representing the logged-in user profile is **lifted up** to the `App` component.
* **Why?** Since `<AvatarHeader />` (displaying the avatar and greeting) and `<AccountInfo />` (form fields where the name is edited) both share the same name data, they must stay synchronized.
* **Result**: When you change the name in `<AccountInfo />`, it communicates upwards via callback, updates the state in `<App />`, and React immediately updates the displayed name in `<AvatarHeader />` and `<AppHeader />` in real-time without requiring a page reload.

---

## 3. How to Run and Test the Converted Page

### A. Start the Backend API Server
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Start the server (default port `3000`):
   ```bash
   npm run start
   ```

### B. Start the React Frontend
1. Open a new terminal in the `react-frontend` directory:
   ```bash
   cd react-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (default port `5174` / `5173`):
   ```bash
   npm run dev
   ```

### C. Verify the backend API connection
Since the React dev server and NestJS run on different origins (`http://localhost:5174/` vs `http://localhost:3000/`), they have separate LocalStorage.
To log in and pull your database profile details:
1. Log in on your legacy app at `http://localhost:3000` in the browser.
2. Press `F12` and run this in the console to copy your token:
   ```javascript
   copy(localStorage.getItem('rx_data'))
   ```
3. Go to the React App at `http://localhost:5174/` in the browser.
4. Press `F12`, go to the Console, and run:
   ```javascript
   localStorage.setItem('rx_data', 'PASTE_HERE')
   ```
   *(Pasting the copied token inside the quotes)*
5. **Refresh the page**. You will now see actual database data being loaded, saved, and validated against the backend controller.
