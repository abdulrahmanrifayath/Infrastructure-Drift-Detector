# Infrastructure Drift Detector

> An intelligent cloud governance platform that continuously detects configuration drift between Infrastructure as Code (IaC) and actual cloud infrastructure, analyzes security and cost impact, prioritizes issues using AI, and provides actionable remediation recommendations.

---

## 🚀 Key Features (Target Architecture)

- **Infrastructure as Code Parsing**: Parses Terraform `.tfstate` files to determine target state.
- **Live AWS Cloud Discovery**: Connects via AWS SDK (`boto3`) to query actual cloud configurations.
- **Multidimensional Drift Detection**:
  - Configuration Drift
  - Security Drift
  - Missing Resources
  - Unmanaged Resources
  - Cost Exposure Drift
  - IAM Policy & Permission Drift
- **AI-Powered Prioritization**: Rule-engine initially with modular architecture for LLM integration.
- **Cloud Agnostic Vision**: Designed using Clean Architecture to support Azure, GCP, and Kubernetes seamlessly in future phases.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL with SQLAlchemy ORM & Alembic
- **Validation**: Pydantic v2
- **Authentication**: JWT Bearer Authentication (`python-jose`, `passlib`, `bcrypt`)
- **Cloud SDK**: `boto3`

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **State & Router**: React Router v6, React Query (`@tanstack/react-query`), Axios

### Infrastructure & DevOps
- Docker & Docker Compose

---

## 📁 Repository Structure (Clean Architecture)

```
Infrastructure-Drift-Detector/
├── backend/
│   ├── app/
│   │   ├── core/                  # Configurations, Database session, Security, Logging
│   │   ├── domain/                # Business domain models (SQLAlchemy entities)
│   │   ├── repositories/          # Data access layer (CRUD & generic BaseRepository)
│   │   ├── services/              # Application services (Auth, Business Logic)
│   │   ├── schemas/               # API Data Transfer Objects (Pydantic DTOs)
│   │   ├── presentation/          # API Controllers, Routers, Dependencies, Middlewares
│   │   └── main.py                # FastAPI Application Entrypoint
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── context/               # AuthContext state management
│   │   ├── pages/                 # Login, Register, Dashboard UI
│   │   ├── routes/                # Protected AppRoutes
│   │   ├── services/              # Axios API instance with interceptors
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚡ Getting Started (Local Development)

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+

### 1. Clone & Configure Environment
```bash
git clone https://github.com/abdulrahmanrifayath/Infrastructure-Drift-Detector.git
cd Infrastructure-Drift-Detector
cp .env.example .env
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```
- **Backend API**: `http://localhost:8000/api/v1/health`
- **Swagger Docs**: `http://localhost:8000/api/v1/docs`
- **Frontend Dashboard**: `http://localhost:5173`

---

## 🛡️ License

Distributed under the MIT License.
