# Airtable Form Builder and Submission Tracker

This project provides a full-stack solution for building dynamic forms based on Airtable tables, handling submissions, and maintaining a local MongoDB database synchronized with Airtable changes using webhooks.

## 🚀 1. Setup Instructions

### Prerequisites

* **Node.js** (v18 or higher)
* **MongoDB** (Local instance or Atlas connection string)
* **Airtable Account** (with necessary Base and Table IDs)
* **Git**

### A. Backend Setup (Node/Express)

1.  **Clone the repository:**
    ```bash
    git clone [YOUR-REPO-URL]
    cd your-project-name
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create `.env` file:** In the root directory, create a file named `.env` and add the following configuration variables:

    ```env
    # MongoDB Connection
    MONGODB_URI=mongodb://localhost:27017/form_builder_db

    # Server Configuration
    PORT=4000

    # Airtable OAuth Credentials (See Section 2 for setup)
    AIRTABLE_CLIENT_ID=[YOUR_AIRTABLE_CLIENT_ID]
    AIRTABLE_CLIENT_SECRET=[YOUR_AIRTABLE_CLIENT_SECRET]
    AIRTABLE_REDIRECT_URI=http://localhost:4000/oauth/airtable/callback


    ```
4.  **Run the server:**
    ```bash
    npm run dev
    ```

### B. Frontend Setup (React.js)
# 🚀 Quick Start

## Prerequisites
- Node.js 18+ (`node -v`)
- npm/yarn/pnpm

## 1. Clone & Install
git clone <your-repo>
cd frontend
npm install

## 2. Start Development
npm run dev

**Opens:** `http://localhost:5173`

## 3. Build for Production
npm run build
npm run preview # Test build

## Scripts
npm run dev # Development server (hot reload)
npm run build # Production build
npm run lint # Code quality
npm run test # Run tests

---

## 🔑 2. Airtable OAuth Setup Guide

To allow users to link their Airtable accounts, you must register your application as an OAuth Client on Airtable.

1.  **Go to Airtable Developer Hub:** Navigate to the **Airtable developer console** and create a new **OAuth Client**.
2.  **Set Redirect URI:** Crucially, set the **Redirect URL** to match the value in your `.env` file:
    ```
    http://localhost:4000/oauth/airtable/callback
    ```
3.  **Define Scopes:** Grant the necessary permissions for your application:
    * `data.records:read`
    * `data.records:write`
    * `schema.bases:read`
4.  **Obtain Credentials:** After creation, Airtable will provide the **Client ID** and **Client Secret**.
5.  **Update `.env`:** Copy these values into your backend's `.env` file under `AIRTABLE_CLIENT_ID` and `AIRTABLE_CLIENT_SECRET`.

---

## 🧱 3. Data Model Explanation

The application uses three primary MongoDB models to handle data:

| Model | Purpose | Key Fields | Relationship |
| :--- | :--- | :--- | :--- |
| **`User`** | Stores user authentication and Airtable access tokens. | `accessToken`, `airtableId` | One-to-many relationship with `Form`. |
| **`Form`** | Stores the structure and metadata of the form. | `ownerId`, `baseId`, `tableId`, `questions` (array) | One-to-many relationship with `Submission` (via `formId`). |
| **`Submission`** | Stores the actual answers submitted by a user. **This is the local source of truth.** | `formId`, `answers` (Object), `status`, `submissionId` (Airtable Record ID) | Stores submissions separately to enable efficient searching and webhook updates. |


---

## 📐 4. Conditional Logic Explanation

The form supports **question-level conditional rendering** based on the answers to other fields.

* **Logic:** Conditions are stored in the `rules` field of a question object (e.g., in the `Form` model).
* **Example:** The **Notes** field is only visible (`rules` apply) if the **Status** field is set to `"In Progress"`.
* **Implementation:** The backend constructs the `rules` object during form creation by mapping the field names (e.g., "Notes") to their corresponding field IDs (`questionKey`) and checking the defined trigger value (e.g., "In Progress"). The frontend must consume this `rules` object to hide or show the relevant input fields dynamically.

---

## 🔗 5. Webhook Configuration

The application uses **Airtable Webhooks** to ensure the local MongoDB `Submission` records stay synchronized with any external changes made directly in Airtable.

### Backend Endpoint

* **URL:** `POST /webhooks/airtable`
* **Function:** This endpoint calls `handleAirtableWebhook` to process the events.

### Webhook Handling

| Airtable Event | Backend Action | MongoDB Field/Status |
| :--- | :--- | :--- |
| **Record Updated** | The controller finds the `Submission` document by its `submissionId` (Airtable Record ID) and updates the local `answers` object. | `status` updated to `"Updated"`. |
| **Record Deleted** | The controller finds the `Submission` document by its `submissionId` and **flags** it. | `deletedInAirtable` set to **`true`**. (No hard delete locally). |

### Setup in Airtable

1.  Log into Airtable and navigate to your Base.
2.  Go to **Automations** or **Webhooks** (depending on the interface).
3.  Set up a webhook to be triggered on **`Update`** and **`Delete`** events for the relevant table.
4.  Set the **Target URL** to your exposed public URL: `[YOUR_PUBLIC_URL]/webhooks/airtable`
    *(Note: For local testing, you must use a tool like **ngrok** to expose your `http://localhost:4000` to the public internet.)*

---

## ▶️ 6. How to Run the Project

1.  **Ensure MongoDB is running** and your **`.env`** is configured correctly.
2.  **Start the backend server:**
    ```bash
    npm run dev
    ```
3.  **Access the API:** The server runs on `http://localhost:4000`.

### Key API Endpoints

| Feature | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Create Form** | `POST` | `/api/form` | Creates a new form structure in MongoDB from Airtable field definitions. |
| **Submit Form** | `POST` | `/api/form/:formId/submit` | Saves the submission to MongoDB and sends the record to Airtable. |
| **List Responses** | `GET` | `/api/forms/:formId/responses` | Fetches a list of all submissions for a given form directly from MongoDB (data model: `Submission`). |
| **Airtable Webhook** | `POST` | `/webhooks/airtable` | Receives updates and deletions from Airtable to keep the MongoDB `Submission` collection synchronized. |
