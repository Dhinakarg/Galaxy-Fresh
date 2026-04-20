# 🌌 Galaxy Fresh: The Ultimate Kitchen ERP Protocols

Galaxy Fresh is a state-of-the-art Enterprise Resource Planning (ERP) platform designed specifically for high-pressure commercial kitchens, bakeries, and retail food outlets. It bridges the gap between chaotic physical stock and real-time visual financial intelligence.

---

## 🧭 Problem Statement
In professional hospitality, **inventory leakage** is the silent killer of profit margins. Spoilage due to poor stock rotation, lack of First-In First-Out (FIFO) discipline, and manual tracking errors lead to massive revenue loss. 

**Galaxy Fresh** solves this by implementing an atomic, transaction-safe inventory engine that handles batch depletion automatically, ensuring every gram of ingredient is accounted for.

---

## 🔐 Access Protocols (Sample Credentials)
For demonstration and evaluation purposes, use the following provisioned identities to explore the different hierarchical levels of the ERP:

| Role | Email Identifier | Access Key | Permissions |
| :--- | :--- | :--- | :--- |
| **Manager** | `manager@example.com` | `manager@123` | Full control, Team induction, Insights. |
| **Supervisor** | `supervisor@example.com` | `supervisor@123` | Log Usage, Add/Edit/Delete Inventory, View Dashboard/Inventory,  |
| **Chef** | `chef@example.com` | `chef@123` | Log usage, View Dashboard/Inventory. |
| **Owner** | `owner@example.com` | `owner@123` | Full control, Fiscal oversight. |


---

## ✨ Flagship Features

### 🌓 Dual-Theme Engine (Midnight vs. Cloud)
*   **The Problem**: Kitchen lighting varies. Staff need high-contrast views in bright prep areas and low-strain dark views for evening night shifts.
*   **The Solution**: A custom, class-based theme engine. Toggle between **Cloud Mode** (Clean White) and **Midnight Mode** (Precision Charcoal) with a single click. Galaxy Fresh ignores OS settings to give chefs explicit control.

### 🍱 Intelligent FIFO Depletion
*   **Strategy**: Our core engine automatically subtracts ingredients from the **oldest available batches** first.
*   **Live Preview**: Chefs can see exactly which batch (Purchase Date/Expiry) is being depleted in real-time before they confirm a log entry.

### 📊 Visual Intelligence (Insights)
*   **Capital Allocation**: Visualizes exactly where your inventory budget is sitting (Seafood vs. Produce vs. Dry Goods).
*   **Spending Ledger**: Tracks investment trends month-over-month through high-fidelity Bar and Pie charts powered by **Recharts**.

### 🛒 Automated Procurement
*   **Par-Level Logic**: The app automatically identifies shortages and generates a shopping list with exact "Order Vol" needed to return to optimal stock levels.
*   **Print-Ready Checklist**: Native `@media print` styling generates clean, ink-saving B&W checklists for physical stock-taking.

---

## 🛠️ Technical Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Modular, hook-based architecture with ultra-fast HMR. |
| **Styling** | Tailwind CSS v4 | Utility-first design with custom high-end theme variants. |
| **Database** | Firebase Firestore | Real-time NoSQL synchronization with atomic transactions. |
| **Identity** | Firebase Auth | Secure induction and induction protocols. |
| **Visuals** | Recharts | D3-based professional data visualization. |

---

## 📡 Data Schema (Interpreted)

Galaxy Fresh uses a shared organizational hierarchy. Profiles are initialized with **INR (₹)** as the primary fiscal benchmark for regional precision.

```javascript
// Example Ingredient Schema
{
  name: "Alaskan King Crab",
  category: "Seafood",
  quantity: 12,
  unit: "kg",
  parLevel: 20,
  cost: 4500,
  batches: [
    { qty: 10, purchaseDate: Timestamp, expiryDate: Timestamp },
    { qty: 2,  purchaseDate: Timestamp, expiryDate: Timestamp }
  ],
  userId: "manager_uid" // Originator ID
}
```

---

## ⚖️ License & Ethical Use
Galaxy Fresh is designed for professional kitchen integrity. By using this system, you commit to maintaining strict FIFO protocols and accurate waste logging to maximize sustainability in the hospitality industry.
