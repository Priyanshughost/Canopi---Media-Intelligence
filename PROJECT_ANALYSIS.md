# Canopi: AI-Powered Impact & Sustainability Media Platform
## Comprehensive Project Analysis & Feature Implementation Status

---

## 1. Project Overview & Vision

**Canopi** is an AI-powered media intelligence platform designed specifically for NGOs, non-profits, CSR initiatives, environmental organizations, and governmental bodies. 

### The Problem
Field operations in sustainability projects (such as reforestation, ocean cleanups, waste management, wildlife preservation, and rural infrastructure) generate thousands of unstructured photos and videos. Organizations struggle to:
- Organize, tag, and locate specific media items across large distributed teams.
- Rigorously prove verifiable impact to donors, auditors, and stakeholders.
- Avoid unsubstantiated greenwashing claims while extracting compelling impact stories.

### The Canopi Solution
Canopi bridges the gap between raw field media and verified impact reporting. It ingests photos and videos, performs automated vision intelligence, indexes visual metadata into vector databases for semantic search, enables automated Before/After comparison analysis, implements a Human-in-the-Loop verification process, and generates audit-ready impact reports and social campaigns backed by LangGraph safeguards.

---

## 2. Architecture & Technology Stack

```mermaid
graph TD
    User([User / Browser]) <-->|HTTP/REST| Client[React 19 + Vite Frontend]
    
    subgraph Frontend Pages
        Dashboard[Dashboard & Metrics]
        ProjectsUI[Projects Management]
        MediaUI[Media Explorer]
        SearchUI[Semantic Search]
        CompUI[Before/After Comparisons]
        EvidenceUI[Evidence Verification]
        ReportsUI[Impact Reports & Campaigns]
    end
    
    Client --> Dashboard
    Client --> ProjectsUI
    Client --> MediaUI
    Client --> SearchUI
    Client --> CompUI
    Client --> EvidenceUI
    Client --> ReportsUI

    subgraph Backend API [Node.js + Express 5]
        ProjectCtrl[Project Controller]
        AssetCtrl[Asset Controller & Service]
        SearchCtrl[Semantic Search Controller]
        CompCtrl[Comparison Controller]
        EvidenceCtrl[Evidence Controller]
        ReportCtrl[Report & Campaign Controller]
    end

    Client <-->|REST API| Backend API

    subgraph External & Storage Services
        Mongo[(MongoDB)]
        Pinecone[(Pinecone Vector DB)]
        Cloudinary[(Cloudinary Storage)]
        GroqVision[Groq / Qwen / Gemini Vision]
        Embeddings[Text Embeddings API]
        LangGraph[LangGraph Safeguard Workflow]
    end

    AssetCtrl --> Cloudinary
    AssetCtrl --> Mongo
    AssetCtrl --> GroqVision
    AssetCtrl --> Embeddings
    Embeddings --> Pinecone

    SearchCtrl --> Embeddings
    SearchCtrl --> Pinecone
    SearchCtrl --> Mongo

    CompCtrl --> GroqVision
    CompCtrl --> EvidenceCtrl

    ReportCtrl --> LangGraph
    ReportCtrl --> GroqVision
    ReportCtrl --> Mongo
```

### Full Technology Stack Breakdown

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, Vite | Modern, high-performance single page application |
| **Routing & State** | React Router DOM v7, React Hooks | Client-side routing and reactive UI states |
| **Styling & Icons** | Tailwind CSS v4, Lucide React | Clean, responsive, glassmorphic & brutalist UI components |
| **Data Visualization** | Recharts | Interactive upload trends & analytics bar charts |
| **Markdown Rendering** | React Markdown | Formatting AI-generated impact reports and executive summaries |
| **Backend API** | Node.js, Express 5 (ES Modules) | High-speed RESTful API and async processing pipeline |
| **Primary Database** | MongoDB (Mongoose 9) | Storing Projects, Media Assets, Evidence drafts, and Reports |
| **Vector Database** | Pinecone Vector Store | High-dimensional semantic vector indexing and similarity search |
| **Media Hosting** | Cloudinary SDK v2, Multer | Media storage, transformations, and global CDN delivery |
| **LLMs & Vision AI** | Groq (`qwen-27b`, `gpt-120b`, `gpt-safeguard-20b`, `gemini-1.5-flash`) | Structured visual extraction, comparisons, and report generation |
| **Orchestration & AI Agentic Flow** | LangChain, LangGraph, Zod | StateGraph validation cycles and structured JSON schema enforcement |

---

## 3. Implemented Features (Current State)

### 📁 1. Project Management
- **Project Creation & Organization**: Create and manage impact projects with custom titles, descriptions, organizations, start/end dates, locations, and operational statuses (`PLANNED`, `ACTIVE`, `COMPLETED`, `ON_HOLD`).
- **Project Metrics & Overview**: Real-time project counters, active project statistics, and aggregated asset and evidence counts.
- **Project Details Hub**: Dedicated project dashboard displaying media galleries, project-scoped evidence, uploaded assets, and direct media uploaders.

### 📸 2. Asynchronous Media Pipeline & Vision Extraction
- **Cloudinary Asset Ingestion**: Multipart file upload handling with Multer and secure Cloudinary uploading.
- **Asynchronous 5-Stage Processing Engine**:
  1. `UPLOADED`: Asset stored in Cloudinary and registered in MongoDB.
  2. `ANALYZING`: Vision AI (`Qwen-27b` / `Gemini-1.5-flash`) processes the media to extract structured metadata:
     - Detailed descriptive summary
     - Detected physical objects (`people`, `trees`, `waste`, `waterways`, etc.)
     - Detected activities (`waste collection`, `tree planting`, `community outreach`)
     - Thematic tags and observable visual signals
  3. `EMBEDDING`: Synthesizes project and visual analysis into semantic text strings and computes dense vector embeddings.
  4. `INDEXING`: Automatically upserts embeddings and metadata payloads to the Pinecone Vector database.
  5. `READY` / `FAILED`: Final status marker with real-time UI polling updates (2-second polling intervals).
- **Media Explorer**: Full visual gallery showcasing all processed assets with real-time status badges, filter controls, and AI-inferred tag chips.

### 🔍 3. Natural Language Semantic Search Engine
- **Pinecone Vector Similarity Search**: Users can search unstructured media using natural human language queries (e.g., *"Show me community volunteers clearing plastic from the river"*).
- **Metadata Hybrid Enrichment**: Embeds the query on the fly, queries Pinecone for nearest neighbors (Cosine Similarity), and populates enriched MongoDB asset documents for rendering.

### ⚖️ 4. Visual Evidence Comparison (Before & After Analysis)
- **Dual-Asset Visual Audit**: Select baseline (Before) and outcome (After) images for automated comparative evaluation.
- **Structured AI Differencing**: Generates category-based change breakdowns (`category`, `before`, `after`, `change`) alongside explicit limitations.
- **1-Click Evidence Creation**: Directly converts comparison results into immutable draft evidence items.

### 🛡️ 5. Evidence Management & Verification (Human-in-the-Loop)
- **"Observation != Proof" Guardrails**: Strict architectural separation between raw AI observations and verified impact evidence.
- **Review & Verification Interface**: Project managers can audit AI-generated findings and explicitly verify (`PUT /api/evidence/:id/verify`) or reject/delete false observations.
- **Verification Gate**: Ensures only verified evidence records are eligible for formal impact reports and public campaign generation.

### 📊 6. Automated Impact Reporting & Campaign Generation
- **StateGraph AI Report Synthesis**:
  - **LangGraph Multi-Agent Pipeline**: Drafts reports using high-reasoning models (`gpt-120b`) and evaluates claims with a dedicated safeguard model (`gpt-safeguard-20b`) enforcing the "Observation != Proof" rule.
  - **Iterative Self-Correction**: Cycles through draft-validate-rewrite loops to eliminate hallucinated scientific metrics (e.g., unsupported CO2 figures) before finalization.
- **Structured Report Content**: Produces Executive Summaries, Key Findings, Visual Limitations, and lists of verified source evidence.
- **Campaign Generator**: Creates targeted social media campaign copy tailored to verified project milestones.

### 📈 7. Real-Time Dashboard & Analytics
- **Live Summary Metrics**: Displays active projects, total media assets, and verified evidence count.
- **Activity & Upload Trend Charting**: Recharts-powered 7-day upload activity graphs.
- **Quick-Access Navigation**: Rapid project creation modal, recent projects cards, and direct navigation links to all platform modules.

---

## 4. API Endpoints Reference

### Projects (`/api/projects`)
- `GET /api/projects` - List all projects
- `GET /api/projects/stats` - Summary statistics (active projects, total assets, verified evidence)
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Fetch single project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Assets (`/api/assets`)
- `POST /api/assets/upload` - Upload media file to Cloudinary and trigger async AI pipeline
- `GET /api/assets` - List all assets (filterable by `projectId` and `mediaType`)
- `GET /api/assets/:id` - Get specific asset details and AI analysis
- `DELETE /api/assets/:id` - Delete asset

### Semantic Search (`/api/search`)
- `POST /api/search/semantic` - Perform Pinecone vector search with natural language query

### Comparisons (`/api/comparisons`)
- `POST /api/comparisons/before-after` - Compare two image assets and generate structured change observations & evidence draft

### Evidence (`/api/evidence`)
- `GET /api/evidence` - List evidence items (filterable by `projectId`, `verified`)
- `POST /api/evidence` - Create draft evidence
- `PUT /api/evidence/:id/verify` - Mark evidence item as verified
- `DELETE /api/evidence/:id` - Reject / remove evidence

### Reports (`/api/reports`)
- `POST /api/reports/generate` - Generate structured impact report from verified evidence
- `GET /api/reports` - Fetch generated reports (filterable by `projectId`)
- `POST /api/reports/campaign` - Generate campaign content for verified project evidence

---

## 5. Summary Table of Core Entities

| Entity | Primary Purpose | Key Fields |
| :--- | :--- | :--- |
| **`Project`** | Represents a field initiative or environmental campaign | `name`, `organization`, `status`, `startDate`, `locations` |
| **`MediaAsset`** | Ingested photo/video record | `cloudinary`, `mediaType`, `aiAnalysis`, `processingStatus` |
| **`Evidence`** | Verifiable observation linking assets to impact | `projectId`, `type`, `sourceAssets`, `observations`, `verified` |
| **`Report`** | Formal impact document with safeguard guarantees | `title`, `executiveSummary`, `keyFindings`, `limitations`, `evidenceUsed`, `campaignContent` |

---

*Generated for Canopi Media Intelligence Platform.*
