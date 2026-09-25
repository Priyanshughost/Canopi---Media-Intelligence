# Canopi: AI-Powered Impact & Sustainability Media Platform

## 1. Problem Statement & Overview
NGOs, governments, and sustainability organizations generate massive volumes of unstructured photos and videos from field projects (e.g., environmental cleanups, infrastructure development). 
Manually organizing, verifying, and extracting meaningful stories from this raw media is incredibly time-consuming. **Canopi** solves this by acting as an AI-powered media intelligence engine. It leverages **Cloudinary** for robust media handling, **Groq** for high-speed vision AI, and **Pinecone** for semantic search, instantly turning raw field photos into structured evidence, verifiable before/after comparisons, and campaign-ready impact reports.

---

## 2. System Architecture Diagram

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#0891b2,stroke:#06b6d4,stroke-width:2px,color:#fff,rx:8px,ry:8px
    classDef backend fill:#1e293b,stroke:#334155,stroke-width:2px,color:#fff,rx:8px,ry:8px
    classDef db fill:#059669,stroke:#10b981,stroke-width:2px,color:#fff,rx:10px,ry:10px
    classDef external fill:#7c3aed,stroke:#8b5cf6,stroke-width:2px,color:#fff,rx:8px,ry:8px

    %% Nodes
    User([User / Web Browser])
    
    subgraph Frontend [React + Vite + Tailwind UI]
        Dashboard[Dashboard & Metrics]
        MediaUI[Media Explorer]
        CompUI[Before/After Comparisons]
        SearchUI[Semantic Search]
    end

    subgraph Backend [Express + Node.js API]
        UploadCtrl[Upload Controller]
        Pipeline[Async AI Pipeline Engine]
        CompCtrl[Comparison Engine]
        SearchCtrl[Vector Search Engine]
        ReportCtrl[Report Generator]
    end

    subgraph Storage [Databases]
        Mongo[(MongoDB <br> Projects, Assets, Evidence)]
        Pinecone[(Pinecone Vector DB <br> Semantic Search)]
    end

    subgraph External [External APIs & Services]
        Cloudinary{Cloudinary <br> Asset Host & Transforms}
        GroqVision{Groq API <br> qwen-27b Vision}
        Embedder{Embedding API <br> text-embedding}
    end

    %% Connections
    User <-->|HTTP/REST| Frontend
    Dashboard --> Backend
    MediaUI --> UploadCtrl
    CompUI --> CompCtrl
    SearchUI --> SearchCtrl

    %% Upload Flow
    UploadCtrl -->|1. Upload File| Cloudinary
    Cloudinary -->|2. Secure URL & Metadata| UploadCtrl
    UploadCtrl -->|3. Create Asset Record| Mongo
    UploadCtrl -->|4. Trigger Async Job| Pipeline

    %% AI Pipeline Flow
    Pipeline -->|5. Pass Cloudinary URL| GroqVision
    GroqVision -->|6. JSON: Activities, Location| Pipeline
    Pipeline -->|7. Generate Text| Embedder
    Embedder -->|8. Return Vector| Pipeline
    Pipeline -->|9. Upsert Vector| Pinecone
    Pipeline -->|10. Mark READY| Mongo

    %% Search & Compare
    SearchCtrl -->|Query Text| Embedder
    SearchCtrl -->|KNN Search| Pinecone
    CompCtrl -->|Two Cloudinary URLs| GroqVision
    CompCtrl -->|Save Draft Evidence| Mongo
    ReportCtrl -->|Query Evidence| Mongo
    ReportCtrl -->|Synthesize Markdown| GroqVision

    %% Apply Styles
    class Frontend frontend
    class Backend backend
    class Mongo,Pinecone db
    class Cloudinary,GroqVision,Embedder external
```

---

## 3. The Core Media Processing Pipeline (Execution Flow)

The heart of the application is the asynchronous media processing pipeline. Because large AI models take time to evaluate images, the platform is designed to respond immediately and process data in the background.

```mermaid
sequenceDiagram
    autonumber
    participant Client as React UI
    participant API as Express Server
    participant Cloud as Cloudinary
    participant DB as MongoDB
    participant AI as Groq Vision API
    participant Pine as Pinecone Vector DB

    Client->>API: POST /api/assets/upload (multipart/form-data)
    API->>Cloud: Upload Raw Media Buffer
    Cloud-->>API: Returns secure_url, width, height, format
    API->>DB: Create MediaAsset (Status: UPLOADING)
    API-->>Client: 201 Created (Return Asset ID)
    
    Note over Client, API: User continues using app while processing happens

    %% Async Pipeline starts here
    API->>DB: Update Status to ANALYZING
    API->>AI: Send Cloudinary secure_url + Extraction Prompt
    AI-->>API: Structured JSON (description, activities, location)
    API->>DB: Save AI Analysis to MediaAsset
    
    API->>DB: Update Status to EMBEDDING
    API->>API: Generate Semantic Text String from Analysis
    API->>API: Generate 768-dim Embedding Vector
    
    API->>DB: Update Status to INDEXING
    API->>Pine: Upsert { id: assetId, values: vector, metadata }
    Pine-->>API: 200 OK
    
    API->>DB: Update Status to READY
    Note over Client: Polling mechanism detects 'READY' and updates UI
```

## 4. Key Execution Modules Explained

### A. Semantic Search Module
Instead of exact keyword matching (which fails when users type "water cleanup" but the image is tagged "river pollution"), we use Semantic Search.
1. The user types a natural language query in the UI.
2. The query is converted into a mathematical vector using an embedding model.
3. We query **Pinecone** using Cosine Similarity to find the closest matching vectors.
4. Pinecone returns the `assetId`s, which we use to fetch the full records from **MongoDB**.

### B. Visual Evidence Comparison
1. The user selects a "Before" image (baseline) and an "After" image (outcome).
2. The `comparison.controller.js` retrieves both **Cloudinary** secure URLs.
3. Both URLs are passed simultaneously to the **Groq Vision model**, prompting it to act as an environmental auditor.
4. The AI returns a JSON array of `observations` (e.g., "The riverbank in image A contains debris, image B shows newly planted vegetation").
5. This JSON is packaged into an `Evidence` object and stored in the database to guarantee immutability.
