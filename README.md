# Kadu Academy Web Platform

## Project Overview

The Kadu Academy Web Platform is a full-stack educational web application designed to help administrators manage test series, student data, and user authentication. It features a robust admin dashboard with protected routes, as well as a public-facing section for users.

This project was built from the ground up to address the need for a dynamic and secure platform for online test management.

## Key Features

  * **Role-Based Authentication:** Secure login for administrators and different user types (College, Kadu Academy, Free) via Firebase Authentication.
  * **Comprehensive Admin Dashboard:** An intuitive and secure admin interface for managing the entire platform.
  * **Dynamic Test Management:**
      * **CRUD Operations:** Create, read, update, and delete tests and questions.
      * **Drag-and-Drop Reordering:** Easily change the order of questions in a test using a user-friendly drag-and-drop interface.
      * **Question Import:** Import questions from other existing tests to save time and effort.
  * **Rich Content Support:**
      * **LaTeX/KaTeX Integration:** Questions and options support mathematical expressions and formulas.
      * **Image Uploads:** Questions and options can include images hosted on Firebase Storage, with flexible placement (above, in-between, or below text).
  * **Integrated Web-to-App Workflow:**
      * The web platform is seamlessly connected to a companion **Flutter mobile app**.
      * Administrators create tests on the website, and students appear for them through the mobile app.
      * An admin can **approve or deny student access** to paid tests based on fee payment.
      * Admins and teachers can view test results and **export them to PDF or Excel** for easy analysis and record-keeping.
  * **Data Synchronization:** Uses Firebase Firestore for real-time data management, ensuring all changes are instantly reflected.
  * **Secure & Scalable Backend:** All data and user sessions are managed securely through a Firebase backend, providing a scalable solution.

## Technologies Used

This project was developed using a modern technology stack.

  * **Frontend (Web):**

      * **React.js:** The core JavaScript library for building the user interface.
      * **React Router:** For handling navigation and routing between different pages.
      * **Tailwind CSS:** For fast and efficient styling of the application.
      * **react-latex-next:** For rendering mathematical expressions.
      * **@hello-pangea/dnd:** For the drag-and-drop functionality.

  * **Frontend (Mobile App):**

      * **Flutter:** The UI toolkit used to build the cross-platform iOS and Android app.

  * **Backend & Database:**

      * **Firebase:**
          * **Authentication:** For user sign-in and protected routes.
          * **Firestore:** A NoSQL database for storing test, question, and user data.
          * **Storage:** For hosting and managing image uploads.

## Setup and Installation

Follow these steps to set up the project locally.

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yash-masne/kadu-academy-website.git
    ```

2.  **Navigate to the project directory:**

    ```bash
    cd kadu-academy-website
    ```

3.  **Install dependencies:**

    ```bash
    npm install
    ```

    or

    ```bash
    yarn
    ```

4.  **Configure Firebase:**

      * Create a Firebase project.
      * Enable Firebase Authentication, Firestore, and Storage.
      * In the project's root folder, create a `.env.local` file with your Firebase configuration keys:
        ```
        REACT_APP_FIREBASE_API_KEY=your_api_key
        REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
        REACT_APP_FIREBASE_PROJECT_ID=your_project_id
        REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
        REACT_APP_FIREBASE_APP_ID=your_app_id
        ```

5.  **Run the application:**

    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:5173`.
