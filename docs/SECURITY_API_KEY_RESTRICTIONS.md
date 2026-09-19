# 🔐 Google Cloud API Key Restrictions Guide for HabitFlow

This guide outlines the procedure to apply **strict Application and API Restrictions** to the Google Cloud / Firebase API Key used by HabitFlow.

---

## 🎯 Objective
By default, newly generated Firebase Web API Keys are unrestricted. Applying **HTTP Referrer Restrictions** and **API Scope Restrictions** ensures that:
1. Only requests originating from your authorized domains (`https://habitflow-2a53e.web.app`, `localhost:5173`) can communicate with Firebase services using your API key.
2. The key can ONLY invoke necessary APIs (Authentication, Firestore, App Check) and is blocked from accessing any other Google Cloud services.

---

## 🛠️ Step-by-Step Configuration in Google Cloud Console

### 1. Open Google Cloud Credentials Console
1. Navigate directly to the [Google Cloud Credentials Console](https://console.cloud.google.com/apis/credentials).
2. Ensure you have the **`habitflow-2a53e`** project selected in the top project dropdown.

---

### 2. Select the Firebase Web API Key
- Under **API Keys**, locate and click the key with the name **`Browser key (auto created by Firebase)`** or **`Web client API key`**.

---

### 3. Configure Set 1: Application Restrictions (HTTP Referrers)
1. Under **Set an application restriction**, select **Websites (HTTP referrers)**.
2. Under **Website restrictions**, click **ADD AN ITEM** and add each of the following domains:

| Allowed Website Pattern | Purpose |
| :--- | :--- |
| `https://habitflow-2a53e.web.app/*` | Primary Production Firebase Hosting domain |
| `https://habitflow-2a53e.firebaseapp.com/*` | Secondary Firebase Default domain |
| `http://localhost:*/*` | Local development with Vite (`http://localhost:5173`) |
| `http://127.0.0.1:*/*` | Local loopback address |

---

### 4. Configure Set 2: API Restrictions
1. Under **API restrictions**, select **Restrict key**.
2. Click the **Select APIs** dropdown and check **ONLY** the following required services:
   - ✅ **Identity Toolkit API** *(Required for Firebase Email & Password and Google OAuth)*
   - ✅ **Cloud Firestore API** *(Required for realtime habit and expense database sync)*
   - ✅ **Firebase App Check API** *(Required for bot, scraper & replay defense)*
   - ✅ **Token Service API** *(Required for JWT token refresh cycles)*
3. Click **OK** to confirm API selection.

---

### 5. Save and Verify
1. Click **Save** at the bottom of the page.
2. Allow up to 5 minutes for Google Cloud edge proxy caches to propagate the restriction rules globally.
3. Verify that your app continues to function smoothly on `https://habitflow-2a53e.web.app` and `localhost:5173`.
