# Canopi: AI-Powered Impact & Sustainability Media Platform
## Comprehensive Architecture, Cloudinary AI Integration & Complete Feature Analysis

---

## 1. Project Overview & Problem Statement

**Canopi** is an enterprise-grade AI media intelligence platform built for NGOs, non-profits, CSR initiatives, sustainability organizations, and environmental auditors.

### The Problem
Field operations in sustainability projects (such as reforestation, ocean cleanups, renewable energy, clean water access, wildlife protection, and community infrastructure) generate vast volumes of raw photos and videos. Organizations face critical bottlenecks:
1. **Unstructured Media Ingestion**: Thousands of photos and videos arrive without standardized metadata, GPS coordinates, or structured logging.
2. **"Observation != Proof" Dilemma**: Unverified field media often leads to unsubstantiated claims, greenwashing risks, and audit rejections.
3. **Complex Verification & Organization**: Media must be organized simultaneously across three distinct axes: **Project**, **Location**, and **Timeline**.
4. **Storytelling & Stakeholder Reporting**: Turning raw visual data into verifiable before/after comparisons, audit-ready impact reports, Instagram visual stories, and platform-optimized video reels is manual, slow, and labor-intensive.

### The Canopi Solution
Canopi provides an end-to-end, Cloudinary-native AI media intelligence pipeline that ingests, verifies, organizes, and converts field media into verifiable evidence and publication-ready impact stories.

---

## 2. System Architecture & Component Interactions

```mermaid
graph TD
    subgraph Client Layer [Frontend - React 19 + Vite + Tailwind CSS v4]
        DashboardUI[Dashboard & Metrics]
        ProjectDetailsUI[Project Hub: Gallery, Timeline, Locations, Claims]
        MultiUploadUI[Batch Multi-File Dropzone & Live Progress]
        MediaExplorerUI[Media Explorer & Video Player Modal]
        SearchUI[Timestamp-Level Semantic Search]
        CompUI[Photo & Video Comparison Engine]
        EvidenceUI[Human-in-the-Loop Evidence Hub]
        ReportsUI[Visual Reports, Stories, Carousels & Social Reels]
    end

    subgraph API & Controller Layer [Backend - Node.js Express 5 ES Modules]
        AssetCtrl[Asset Ingestion & Video Pipeline]
        ProjectCtrl[Project, Timeline & Locations API]
        ClaimsCtrl[Claim Consistency Check Engine]
        TrustCtrl[Unified Trust Score Calculator]
        SearchCtrl[Semantic Search & Video Deep-Linking]
        CompCtrl[Before/After Visual Delta Engine]
        EvidenceCtrl[Evidence Verification Hub]
        ReportCtrl[Report, Story, Carousel & Reel Generator]
        WebhookCtrl[Cloudinary Notification Handler]
    end

    subgraph Cloudinary Native AI & Media Engine [Cloudinary SDK v2]
        UploadEngine[Uploader with Eager Derivatives]
        PhashEngine[Perceptual Hash pHash & Hamming Distance]
        GpsEngine[EXIF GPS & DateTime Extraction]
        QualityEngine[Optical Quality Analysis & Generative Restore]
        VisionEngine[Cloudinary AI Vision VQA]
        VideoEngine[Cloudinary AI Video Analysis & Frame-Sampling VQA]
        SpliceEngine[Video Concatenation & Text Overlay Engine]
        MetaSyncEngine[Context Metadata Bidirectional Sync]
        SignedUrlEngine[Authenticated Time-Limited URLs]
    end

    subgraph AI Orchestration & Vector Storage
        PineconeStore[(Pinecone Vector DB: Assets & Video Segments)]
        GroqOrchestrator[Groq LLMs: Llama-3.1-8b, GPT-120b, Safeguard-20b]
        LangGraphWorkflow[LangGraph Multi-Agent Safeguard Loop]
        HashtagEngine[Trending Hashtags API & Curated Sector Library]
    end

    subgraph Persistence Layer
        MongoDB[(MongoDB: Projects, Assets, Evidence, Claims, Reports, Carousels)]
    end

    %% Client to API
    Client Layer <-->|REST API / Multipart Upload| API & Controller Layer

    %% Asset Ingestion Flow
    AssetCtrl --> UploadEngine
    UploadEngine --> PhashEngine
    UploadEngine --> GpsEngine
    UploadEngine --> QualityEngine
    AssetCtrl --> VisionEngine
    AssetCtrl --> VideoEngine
    AssetCtrl --> PineconeStore
    AssetCtrl --> MongoDB

    %% Project, Timeline & Claims
    ProjectCtrl --> MongoDB
    ClaimsCtrl --> VisionEngine
    ClaimsCtrl --> GroqOrchestrator
    ClaimsCtrl --> MongoDB

    %% Trust Score & Webhook
    TrustCtrl --> PhashEngine
    TrustCtrl --> GpsEngine
    TrustCtrl --> QualityEngine
    WebhookCtrl <--> Cloudinary Native AI & Media Engine

    %% Semantic Search
    SearchCtrl --> PineconeStore
    SearchCtrl --> MongoDB

    %% Comparisons & Evidence
    CompCtrl --> VisionEngine
    CompCtrl --> GroqOrchestrator
    EvidenceCtrl --> MongoDB

    %% Reports, Visual Story & Reels
    ReportCtrl --> LangGraphWorkflow
    ReportCtrl --> VisionEngine
    ReportCtrl --> SpliceEngine
    ReportCtrl --> HashtagEngine
    ReportCtrl --> MongoDB
```

---

## 3. Technology Stack & Role Matrix

| Component / Platform | Technology | Specific Function / Role in Canopi |
| :--- | :--- | :--- |
| **Media AI & Storage** | **Cloudinary (SDK v2)** | Primary visual intelligence engine: video ingestion, AI Vision VQA, AI Video Analysis, pHash deduplication, optical quality assessment, generative restore, eager derivatives, video concatenation/splicing, text overlays, EXIF GPS extraction, context metadata sync, and signed URLs. |
| **Vector Database** | **Pinecone** | High-dimensional vector indexing for natural language search across image descriptions and timestamp-level video transcript segments (`video:assetId:seg:N`). |
| **AI LLM Orchestration** | **Groq & LangChain / LangGraph** | Fast structured LLM inference (`llama-3.1-8b-instant`, `gpt-120b`, `gpt-safeguard-20b`) for iterative report drafting, claim consistency checks, and social prose polishing with strict anti-hallucination guardrails. |
| **Backend Framework** | **Node.js & Express 5 (ESM)** | High-throughput asynchronous REST API, streaming multipart handlers, and background processing workers. |
| **Primary Database** | **MongoDB & Mongoose 9** | Schema persistence for `Projects`, `MediaAssets`, `Evidence`, `ProjectClaims`, `Reports`, and `CarouselPosts`. |
| **Frontend Framework** | **React 19 & Vite** | Modern client-side reactive interface with hooks, context providers, and optimistic state updates. |
| **Styling & Design System** | **Tailwind CSS v4 & Lucide Icons** | Custom glassmorphic, responsive, dark/light theme UI with dynamic transitions and accessibility attributes. |
| **Charts & Visualization** | **Recharts** | Interactive activity analytics, upload trend charts, and trust score distribution metrics. |

---

## 4. Complete Feature Breakdown & Implementation Details

### 📸 1. Multi-File Batch Media Ingestion (Photos & Videos)
* **Drag-and-Drop Dropzone & Multiple File Selection**: Ingests multiple photos (`.jpg`, `.png`, `.webp`, `.heic`) and videos (`.mp4`, `.mov`, `.webm` up to 100MB) simultaneously.
* **Real-Time Per-File & Overall Progress Bars**: Tracks byte-level upload progress (`0% → 100%`) for each file using `XMLHttpRequest.upload.onprogress`.
* **Instant Gallery Rendering**: As each individual file completes Cloudinary upload and AI processing, it immediately appears in the project gallery without waiting for other queued files.
* **Queue Management**: Supports removing items, adding more files mid-upload, and per-file retry on network failure.
* **Source Files**: [MultiFileUploadModal.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/upload/MultiFileUploadModal.jsx), [uploader.js](file:///g:/Canopi---Media-Intelligence/server/src/services/cloudinaryIntelligence/uploader.js), [upload.js](file:///g:/Canopi---Media-Intelligence/server/src/middleware/upload.js).

---

### 🧠 2. Cloudinary Native AI Intelligence Pipeline
* **Perceptual Hashing (pHash) & Deduplication**: Calculates 64-bit perceptual image hashes on upload; uses Hamming distance (`calculateHammingDistance <= 8`) to detect identical and near-duplicate field media.
* **EXIF GPS & Date Extraction**: Automatically extracts embedded camera metadata (`GPSLatitude`, `GPSLongitude`, `DateTimeOriginal`) into normalized decimal coordinates with `source: 'exif'` traceability.
* **Optical Quality Analysis & Generative Restore**: Inspects focus, exposure, noise, and saturation. If the optical quality score falls below threshold (`0.6`), triggers Cloudinary's AI Generative Restore (`e_gen_restore`) to create an enhanced derivative.
* **Eager Derivatives**: Automatically generates standard web thumbnails (`c_thumb,w_400,h_400`) and 16:9 report crops (`c_fill,ar_16:9,w_1200`) on upload.
* **Bidirectional Metadata Sync**: Syncs project verification statuses, GPS coordinates, and tags directly back into Cloudinary context metadata (`attachCloudinaryContext`, `syncAssetMetadataToCloudinary`).
* **Signed Delivery URLs**: Generates time-limited signed URLs (`generateSignedAssetUrl`) for secure stakeholder sharing.
* **Cloudinary Webhooks**: Dedicated webhook endpoint (`POST /api/webhooks/cloudinary`) to process asynchronous upload, moderation, and transformation events.
* **Source Files**: [cloudinaryIntelligence/index.js](file:///g:/Canopi---Media-Intelligence/server/src/services/cloudinaryIntelligence/index.js), [gps.js](file:///g:/Canopi---Media-Intelligence/server/src/services/cloudinaryIntelligence/gps.js), [phash.js](file:///g:/Canopi---Media-Intelligence/server/src/services/cloudinaryIntelligence/phash.js), [quality.js](file:///g:/Canopi---Media-Intelligence/server/src/services/cloudinaryIntelligence/quality.js), [derivatives.js](file:///g:/Canopi---Media-Intelligence/server/src/services/cloudinaryIntelligence/derivatives.js), [metadataSync.js](file:///g:/Canopi---Media-Intelligence/server/src/services/cloudinaryIntelligence/metadataSync.js).

---

### 🎬 3. Video Ingestion, AI Video Analysis & Timestamp-Level Semantic Search
* **Cloudinary AI Video Ingestion**: Videos are ingested with `resource_type: "video"`, auto-generating poster thumbnails (`c_thumb,w_600,h_400,so_0,f_jpg`) and web streaming delivery URLs (`vc_auto,q_auto,f_auto`).
* **AI Video Analysis with Frame-Sampling VQA Fallback**:
  * Calls Cloudinary AI Video Analysis (Beta) for timestamped visual segmentation.
  * **Temporal Fallback**: If the beta add-on is unavailable, samples representative frames via Cloudinary URL transformation `so_<midPoint>,w_800,c_fill,f_jpg` and executes Cloudinary AI Vision VQA to generate a structured `videoTranscript` array (`startTime`, `endTime`, `description`, `frameUrl`, `confidence`).
* **Timestamp-Level Semantic Search**: Indexes both whole assets and individual video segments into Pinecone. Searches return `{ matchedTimestamp: { start, end }, matchedSnippet, matchedFrameUrl }`, allowing the UI video player to deep-link and seek to the exact second.
* **Source Files**: [videoAnalysis.js](file:///g:/Canopi---Media-Intelligence/server/src/services/cloudinaryIntelligence/videoAnalysis.js), [asset.service.js](file:///g:/Canopi---Media-Intelligence/server/src/modules/assets/asset.service.js), [search.controller.js](file:///g:/Canopi---Media-Intelligence/server/src/modules/search/search.controller.js), [MediaPreviewPanel.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/mediaModal/MediaPreviewPanel.jsx), [Search.jsx](file:///g:/Canopi---Media-Intelligence/client/src/pages/Search.jsx).

---

### 🗺️ 4. Multi-Axis Project Organization (Project, Location, Timeline)
* **Chronological Timeline Aggregation** (`GET /api/projects/:id/timeline`):
  * Groups verified images and videos by date (`groupBy=day|week|month`).
  * Supports date range filters and verified-only filtering.
  * Interactive UI displays media assets and associated verified evidence cards along a vertical timeline.
* **Geographic Location Clusters** (`GET /api/projects/:id/locations`):
  * Groups media assets by geographical proximity (lat/lng coordinates from EXIF GPS).
  * Calculates cluster centroids and asset counts for interactive map/list visualization.
* **Source Files**: [project.controller.js](file:///g:/Canopi---Media-Intelligence/server/src/modules/projects/project.controller.js), [ProjectTimelineTab.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/project/ProjectTimelineTab.jsx), [ProjectLocationsTab.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/project/ProjectLocationsTab.jsx).

---

### 🛡️ 5. Claim Consistency Check (Anti-Greenwashing Cross-Verification)
* **Discrete Claim Extraction**: Parses project descriptions using LLMs into structured checkable claims (`claimText`, `claimType: "quantity" | "activity" | "outcome"`, `subject`).
* **Visual Evidence Verification Engine**: For each claim, inspects verified media assets and calls Cloudinary AI Vision to evaluate whether visual evidence supports the claim.
* **Strict "Observation != Proof" Rules**:
  * Qualitative activities (e.g. "tree planting") can be verified visually (`SUPPORTED`).
  * Quantitative claims (e.g. "50,000 trees planted") cannot be certified from a single photo and are appropriately classified as `PARTIALLY_SUPPORTED` or `INSUFFICIENT_EVIDENCE` with explicit caveat notes.
* **Claim Audit Dashboard**: Displays claim status breakdown badges (`SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNSUPPORTED`, `INSUFFICIENT_EVIDENCE`), confidence scores, and linked visual assets.
* **Source Files**: [claimConsistencyChecker.js](file:///g:/Canopi---Media-Intelligence/server/src/services/claimConsistencyChecker.js), [claim.model.js](file:///g:/Canopi---Media-Intelligence/server/src/modules/claims/claim.model.js), [ProjectClaimsTab.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/project/ProjectClaimsTab.jsx).

---

### 🎖️ 6. Unified Evidence Trust Score (0–100)
* **Multi-Signal Confidence Scoring**: Computes a single interpretable 0–100 score combining:
  * Duplicate penalty (scaled by pHash distance).
  * Moderation / content review penalty.
  * EXIF GPS & timestamp presence bonus.
  * Optical quality score weighting.
  * Human verification status.
  * Video transcript presence and temporal coherence.
* **Factor Breakdown UI**: Each asset displays its Trust Score alongside positive/negative factor tags.
* **Source Files**: [trustScore.js](file:///g:/Canopi---Media-Intelligence/server/src/services/trustScore.js), [TrustScoreBadge.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/common/TrustScoreBadge.jsx).

---

### 📖 7. Cloudinary AI Visual Story Generator (Instagram Story & Feed)
* **Cloudinary AI-Driven Captions**: Selects chronologically ordered verified assets across key phases (`Before`, `During`, `After`) and generates grounded visual captions via Cloudinary AI Vision (No external LLM).
* **Text Overlay Transformations**: Renders burned-in captions onto high-resolution 9:16 Story (`1080x1920`) or 4:5 Feed (`1080x1350`) graphics via Cloudinary URL text overlays.
* **Interactive Instagram Story Viewer**: Includes progress indicator bars, auto-play timer (4.5s), keyboard navigation (left/right/space), pause/play controls, and single/bulk image download.
* **Source Files**: [visualStoryGenerator.js](file:///g:/Canopi---Media-Intelligence/server/src/services/visualStoryGenerator.js), [VisualStoryViewer.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/report/VisualStoryViewer.jsx).

---

### 📱 8. Social Carousel Post Generator
* **Unified Candidate Pool**: Aggregates verified media from both Comparison Evidence and General Gallery assets.
* **Semantic Diversity Discovery**: Uses text embeddings to select 3–7 distinct, high-relevance images for multi-image carousel posts (Instagram / LinkedIn).
* **Post Copy & Alt Text Generator**: Produces SEO-ready carousel caption, sector hashtags, and per-slide captions and accessibility alt text.
* **Source Files**: [carouselGenerator.js](file:///g:/Canopi---Media-Intelligence/server/src/services/carouselGenerator.js), [carousel.model.js](file:///g:/Canopi---Media-Intelligence/server/src/modules/carousel/carousel.model.js), [CarouselPostViewer.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/report/CarouselPostViewer.jsx).

---

### 🎥 9. AI Highlight Reel Splice
* **Automated Video Splice**: Selects top verified video segments from transcripts and uses Cloudinary's Video Concatenation API to generate a 30–60s highlight video URL with grounded transcript overlays.
* **Highlight Reel Player**: Dedicated playback view in reports with download and direct URL sharing.
* **Source Files**: [videoAnalysis.js](file:///g:/Canopi---Media-Intelligence/server/src/services/cloudinaryIntelligence/videoAnalysis.js), [HighlightReelViewer.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/report/HighlightReelViewer.jsx).

---

### ⚡ 10. Platform-Optimized Social Reels & Clips (Reels/Shorts & Twitter/X)
* **Cloudinary AI Vision Segment Scoring**:
  * Evaluates video segments using VQA prompts (`"On a scale of 1 to 10, how clearly does this footage show meaningful activity related to [sector]?"`).
  * **Pure Cloudinary AI Ranking**: Zero vector search / embeddings used in this selection path.
* **Perceptual Diversity Filtering**: Skips temporally or visually duplicate scenes using pHash and time delta checks.
* **Platform Formats**:
  * **Reels / Shorts**: 9:16 vertical (`1080x1920`), 15–20s total, fast 2–4s cuts.
  * **Twitter / X**: 16:9 widescreen (`1280x720`), 20–30s total.
* **Grounded Captioning + Groq Polishing with Safeguard**:
  * Generates raw caption from the #1 scored frame via Cloudinary AI Vision.
  * Polishes tone via Groq (`llama-3.1-8b-instant`) under a strict anti-hallucination prompt.
  * **Number Guardrail**: Checks for fabricated metrics; automatically falls back to raw caption if ungrounded numbers appear.
* **Merged Hashtags**: Combines content-grounded tags with curated/live trending sector tags, explicitly labeled by source (`content`, `live_trending`, `curated`).
* **Source Files**: [socialReelGenerator.js](file:///g:/Canopi---Media-Intelligence/server/src/services/socialReelGenerator.js), [trendingHashtags.js](file:///g:/Canopi---Media-Intelligence/server/src/services/trendingHashtags.js), [hashtagLibrary.js](file:///g:/Canopi---Media-Intelligence/server/src/config/hashtagLibrary.js), [SocialReelViewer.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/report/SocialReelViewer.jsx).

---

### ⚖️ 11. Video-Aware Before / After Visual Delta Comparison
* **Cross-Media Comparison**: Supports Photo vs Photo, Photo vs Video, or Video vs Video comparisons.
* **Cloudinary Frame Snapshots**: Automatically extracts representative poster frames from video assets for comparative visual delta analysis.
* **Structured Observation Drafts**: Outputs category-based changes and limitations, converting observations directly into verifiable evidence drafts.
* **Source Files**: [comparison.controller.js](file:///g:/Canopi---Media-Intelligence/server/src/modules/comparisons/comparison.controller.js), [Comparison.jsx](file:///g:/Canopi---Media-Intelligence/client/src/pages/Comparison.jsx).

---

### 📊 12. LangGraph Safeguarded Impact Reports & Campaign Generation
* **LangGraph Multi-Agent Cycle**: Drafts formal impact reports (`gpt-120b`) and subjects every statement to an automated safeguard audit (`gpt-safeguard-20b`) to eliminate unproven metric claims.
* **Visual Report Renderer**: Renders structured blocks, embedded 16:9 report crops, executive summaries, and methodology limitations.
* **Campaign Generator**: Produces ready-to-post social campaign copy linked to verified visual assets.
* **Source Files**: [report.service.js](file:///g:/Canopi---Media-Intelligence/server/src/modules/reports/report.service.js), [groq.js](file:///g:/Canopi---Media-Intelligence/server/src/ai/groq.js), [VisualReportRenderer.jsx](file:///g:/Canopi---Media-Intelligence/client/src/components/report/VisualReportRenderer.jsx), [Reports.jsx](file:///g:/Canopi---Media-Intelligence/client/src/pages/Reports.jsx).

---

## 5. Summary Table of API Endpoints

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Assets** | `POST` | `/api/assets/upload` | Ingest photo or video to Cloudinary with native AI analysis & Pinecone indexing |
| | `GET` | `/api/assets` | List assets (filtered by `projectId`, `mediaType`, `status`) |
| | `GET` | `/api/assets/:id` | Get asset details, AI transcript, quality score & trust breakdown |
| | `GET` | `/api/assets/:id/trust-score` | Calculate and return unified trust score (0–100) |
| | `GET` | `/api/assets/:id/signed-url` | Generate time-limited authenticated delivery URL |
| | `POST` | `/api/assets/:id/sync-metadata` | Sync local metadata back into Cloudinary context |
| | `DELETE` | `/api/assets/:id` | Permanently delete asset from MongoDB & Cloudinary |
| **Projects** | `GET` | `/api/projects` | List all projects with metadata |
| | `POST` | `/api/projects` | Create new impact project |
| | `POST` | `/api/projects/paraphrase-description` | Paraphrase and translate local language/informal project descriptions into professional English |
| | `GET` | `/api/projects/:id` | Get single project details |
| | `GET` | `/api/projects/:id/timeline` | Get chronologically grouped timeline (`groupBy=day\|week\|month`) |
| | `GET` | `/api/projects/:id/locations` | Get geographic location clusters and centroids |
| **Claims** | `GET` | `/api/projects/:id/claims` | Retrieve extracted claims and cross-verification summary |
| | `POST` | `/api/projects/:id/claims/check` | Extract claims from project description and verify against visual evidence |
| **Search** | `POST` | `/api/search/semantic` | Natural language semantic search (whole images + video timestamp segments) |
| **Comparisons** | `POST` | `/api/comparisons/before-after` | AI visual delta comparison between two photo/video assets |
| **Evidence** | `GET` | `/api/evidence` | List evidence items (filtered by `projectId`, `verified`) |
| | `POST` | `/api/evidence` | Draft new evidence item |
| | `PUT` | `/api/evidence/:id/verify` | Verify evidence item (Human-in-the-Loop) |
| | `DELETE` | `/api/evidence/:id` | Reject / delete evidence |
| **Reports** | `POST` | `/api/reports/generate` | Generate LangGraph-safeguarded visual report |
| | `GET` | `/api/reports` | List all generated reports |
| | `POST` | `/api/reports/:id/visual-story` | Generate Cloudinary AI Vision visual story (`story` 9:16 / `feed` 4:5) |
| | `POST` | `/api/reports/:id/carousel` | Generate multi-image social carousel post with SEO copy & hashtags |
| | `POST` | `/api/reports/:id/highlight-reel` | Generate 30–60s AI Highlight Reel video splice |
| | `POST` | `/api/reports/:id/reel` | Generate platform-optimized social reel (`reels` 9:16 / `twitter` 16:9) |
| | `GET` | `/api/reports/:id/reel` | Fetch generated social reel, grounded captions & merged hashtags |
| **Webhooks** | `POST` | `/api/webhooks/cloudinary` | Ingest Cloudinary async upload, moderation, and transformation webhooks |
| | `GET` | `/api/webhooks/health` | Webhook service health check |

---

## 6. Cloudinary Add-ons & Plan Compatibility

| Cloudinary Capability | Primary API Method | Fallback Mode on Standard / Free Tiers |
| :--- | :--- | :--- |
| **Visual Q&A (AI Vision)** | `cloudinary.api.analyze({ analysis_type: 'ai_vision' })` | Structured metadata parsing & context derivation |
| **AI Video Analysis** | `cloudinary.api.analyze({ analysis_type: 'ai_video' })` | **Temporal Frame-Sampling VQA**: Samples frames via `so_<midPoint>,w_800,c_fill,f_jpg` and runs Cloudinary AI Vision VQA |
| **Optical Quality Analysis** | `quality_analysis: true` in upload parameters | Client-side resolution check & metadata fallback |
| **Generative Restore** | `e_gen_restore` URL transformation | Standard high-quality sharpening & auto-enhancement (`e_improve,q_auto`) |
| **Perceptual Hashing** | `phash: true` in upload parameters | Color histogram and file signature comparison |
| **Video Concatenation & Splice** | Cloudinary Spliced Delivery Transformations | Curated single-clip highlights with text overlays |
| **Eager Derivatives & Thumbnails** | `eager: [{ c_thumb }, { ar_16:9 }]` | Standard on-the-fly URL transformations (Supported on all tiers) |

---

## 7. Verification & Automated Test Suite

All 48 backend automated tests pass cleanly with zero failures:
```bash
> node --test tests/*.test.js

✔ Cloudinary AI Impact Platform API Tests (8 tests)
✔ Carousel Post Generator Service Tests (1 test)
✔ Claim Consistency Check Service Tests (6 tests)
✔ Cloudinary Intelligence Service Unit Tests (14 tests)
✔ Social Reel & Trending Hashtags Service Tests (7 tests)
✔ Evidence Trust Score Calculation Tests (6 tests)
✔ Visual Story Generator Service Tests (4 tests)
✔ Claim Consistency Safeguard Tests (2 tests)

ℹ tests 48 | suites 4 | pass 48 | fail 0 | cancelled 0
```

Frontend bundle compiles cleanly with Vite:
```bash
> vite build
✓ 2651 modules transformed.
✓ built in 4.50s
```

---

*Updated for Canopi Media Intelligence Platform.*
