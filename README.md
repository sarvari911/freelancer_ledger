# Freelancer Ledger

A local-first, serverless financial tracking application for freelancers to manage clients, track invoices, record payments, monitor balances, and generate account statements.

Built to simulate a production-grade AWS serverless architecture locally using **Docker, AWS SAM, LocalStack, and OpenSearch**.

---

## 🚀 Tech Stack

* **Frontend:** React, Vite, TypeScript
* **Backend:** AWS SAM CLI, AWS Lambda (Node.js/TypeScript), REST API Gateway
* **Database & Storage:** LocalStack

  * DynamoDB for data persistence
  * S3 for pre-signed PDF/statement downloads
* **Search Engine:** OpenSearch for full-text invoice description search
* **Containerization:** Docker & Docker Compose

---

## 🏗️ Architecture Overview

```text
                    ┌───────────────────────────┐
                    │   Frontend (React + Vite) │
                    │        Port 5173          │
                    └─────────────┬─────────────┘
                                  │
                                  │ HTTP
                                  ▼
                    ┌───────────────────────────┐
                    │  AWS SAM API Gateway      │
                    │       Port 3000            │
                    │        + Lambda            │
                    └─────────────┬─────────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │ LocalStack      │  │ LocalStack      │  │   OpenSearch    │
    │   DynamoDB      │  │      S3         │  │                 │
    │                 │  │                 │  │ Invoice Search  │
    │ Clients         │  │ Pre-signed      │  │                 │
    │ Invoices        │  │ Statements      │  │ Full-text Search│
    │ Payments        │  │                 │  │                 │
    └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Key Architecture Features

* **Multi-Tenancy:** Uses `x-user-id` headers on every request to enforce strict user-level data isolation.
* **Financial Precision:** All monetary values are stored as integer cents using `amountMinor` to prevent floating-point rounding errors.
* **Auto-Bootstrapping:** LocalStack automatically initializes all required DynamoDB tables and S3 buckets through the `init-aws.sh` initialization script.
* **Local-First:** The entire AWS-style infrastructure can be run locally without requiring a live AWS account.

---

##  Key Features

### Client Management

* Create and manage clients
* View clients belonging to the active user
* Select clients to view their invoices and ledger
* Strict tenant-level data isolation

### Invoice Tracking

* Create invoices with:

  * Amount
  * Due date
  * Custom description
* View invoices associated with a client
* Track invoice payment status

### Ledger Calculations

Backend-powered real-time calculations for:

* **Total Invoiced**
* **Total Paid**
* **Outstanding Balance**
* **Overdue Amount**

### Overpayment Protection

Backend validation prevents users from recording a payment greater than an invoice's remaining balance.

###  Full-Text Invoice Search

OpenSearch indexes invoice descriptions and provides fast keyword-based search across invoices.

### 📄 S3 Pre-Signed Statements

Generate invoice statements and receive temporary pre-signed S3 URLs for secure statement downloads.

###  Tenant Switcher

The frontend includes a tenant switcher between:

```text
demo-user-1
demo-user-2
```

This allows tenant isolation to be tested directly from the UI.

---

##  Prerequisites

Make sure the following are installed before running the project:

* [Node.js](https://nodejs.org/) v18+
* npm
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
* Git

Make sure **Docker Desktop is running** before starting the infrastructure.

---

#  Local Setup & Installation

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/freelancer_ledger.git
cd freelancer_ledger
```

---

## 2. Start Infrastructure

Start LocalStack and OpenSearch using Docker Compose:

```bash
docker compose up -d
```

LocalStack automatically executes `init-aws.sh` and creates the required DynamoDB tables and S3 bucket.

### Verify LocalStack

```bash
docker compose logs localstack
```

You should see the initialization process completing successfully.

### Check Running Containers

```bash
docker compose ps
```

---

## 3. Build & Start the Backend API

From the root project directory:

### Build Lambda Functions

```bash
sam build
```

### Start the Local API Gateway

```bash
sam local start-api
```

The backend API will be available at:

```text
http://127.0.0.1:3000
```

Keep this terminal window running.

---

## 4. Install & Start the Frontend

Open a **second terminal window**.

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

Open the URL in your browser.

---

#  API Reference

All API requests support the following header:

```http
x-user-id: demo-user-1
```

---

##  Client Routes

| Method | Endpoint   | Description                          |
| ------ | ---------- | ------------------------------------ |
| `GET`  | `/clients` | List all clients for the active user |
| `POST` | `/clients` | Create a new client                  |

### Create Client

Request body:

```json
{
  "name": "John",
  "email": "john@example.com"
}
```

---

## 🧾 Invoice Routes

| Method | Endpoint                       | Description                            |
| ------ | ------------------------------ | -------------------------------------- |
| `GET`  | `/clients/{clientId}/invoices` | Get all invoices for a specific client |
| `POST` | `/clients/{clientId}/invoices` | Create an invoice for a client         |

### Create Invoice

Request body:

```json
{
  "amountMinor": 50000,
  "description": "Website Development",
  "dueDate": "2026-10-01"
}
```

> `amountMinor` represents the amount in the smallest currency unit. For example, `50000` represents ₹500.00 if the application is configured to use INR cents/paise-style units.

---

##  Payment & Ledger Routes

| Method | Endpoint                         | Description                   |
| ------ | -------------------------------- | ----------------------------- |
| `POST` | `/invoices/{invoiceId}/payments` | Record a payment              |
| `GET`  | `/clients/{clientId}/ledger`     | Get live client ledger totals |

### Record Payment

Request body:

```json
{
  "amountMinor": 25000
}
```

The backend validates the payment against the invoice's remaining balance.

---

##  Search & Statements

| Method | Endpoint                     | Description                                                  |
| ------ | ---------------------------- | ------------------------------------------------------------ |
| `GET`  | `/search/invoices?q={query}` | Search invoice descriptions using OpenSearch                 |
| `POST` | `/invoices/{invoiceId}/pdf`  | Generate a statement and return a pre-signed S3 download URL |

### Invoice Search Example

```text
GET /search/invoices?q=website
```

---

# Testing & Verification

## Backend Build Verification

From the project root:

```bash
sam build
```

A successful build confirms that the backend Lambda functions and SAM configuration compile correctly.

---

## Frontend Build Verification

Navigate to the frontend directory:

```bash
cd frontend
npm run build
```

This verifies that the React/Vite frontend compiles successfully for production.

---


#  Local AWS Architecture

The project replicates several AWS services locally:

| AWS Service    | Local Implementation      |
| -------------- | ------------------------- |
| AWS Lambda     | AWS SAM Local             |
| API Gateway    | AWS SAM Local API Gateway |
| DynamoDB       | LocalStack DynamoDB       |
| S3             | LocalStack S3             |
| OpenSearch     | Docker OpenSearch         |
| Infrastructure | Docker Compose            |

This makes it possible to develop and test an AWS-style serverless application without deploying the infrastructure to a live AWS environment.

---


# 🎯 Project Goals

Freelancer Ledger demonstrates how a production-style financial application can be designed using:

* Serverless architecture
* Local AWS emulation
* Event-driven backend services
* Containerized infrastructure
* Multi-tenant data isolation
* Financially safe integer-based calculations
* Full-text search
* Object storage
* Pre-signed URLs
* Modern React frontend



---


