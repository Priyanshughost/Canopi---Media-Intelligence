# Canopi: Problem Statement to Feature Mapping & Debugging Guide

This guide breaks down the core requirements of the "Cloudinary AI-Powered Impact & Sustainability Media Platform" problem statement, maps them to the built application features, explains the execution flow from UI to backend, and provides instructions on how to test them.

---

## 1. Goal: Analyze and Intelligently Organize Large Collections of Image and Video Evidence
**Requirement Map:** Automatically understand field media, extract tags/locations/activities, and organize it by project.

### Built Feature: Automated Media Ingestion Pipeline
When media is uploaded, the system doesn't just save a file; it runs an intelligent AI pipeline to categorize it.

#### Execution Flow (Debugging Path)
1. **Frontend:** User clicks "Upload Evidence" on `client/src/pages/ProjectDetails.jsx`.
2. **Upload & Webhook:** The file goes directly to Cloudinary via the frontend widget. Cloudinary fires a webhook to the backend `/api/assets/webhook`.
3. **Backend Service (`asset.service.js`):**
   - Receives the webhook with the Cloudinary `secureUrl`.
   - Triggers `analyzeImage()` (LangChain + Groq `llama-3.2-90b-vision-preview`).
   - The AI identifies locations, sustainability activities, tags, and generates a rich description.
   - Triggers `generateEmbedding()` (Google GenAI `text-embedding-004`) based on the AI's description.
   - Saves the asset to MongoDB and upserts the embedding vector to Pinecone for search.

#### How to Test
1. Create a new Project in the Dashboard.
2. Click into the project and upload a new field image (e.g., planting trees).
3. Wait ~5-10 seconds, then refresh the page. You will see AI-generated tags, an inferred location, and a detailed description attached to the image without any human input.
4. **Debug Logs:** Check the Node.js console for `[INFO]: Webhook received for asset` and `[INFO]: Asset analysis and indexing complete`.

---

## 2. Goal: Compare Before-and-After Media to Demonstrate Changes
**Requirement Map:** Visually and programmatically compare two pieces of media over a timeline to prove impact.

### Built Feature: AI-Powered Media Comparison & Evidence Generation
A dedicated comparison engine that analyzes visual delta between two timestamps.

#### Execution Flow (Debugging Path)
1. **Frontend:** User navigates to `client/src/pages/Comparison.jsx`, selects two images (Before & After), and clicks "Analyze Impact".
2. **API:** Sends `POST /api/comparisons/analyze` with `beforeAssetId` and `afterAssetId`.
3. **AI Chain (`chains/compareImages.js`):**
   - Fetches the Cloudinary URLs from MongoDB.
   - Uses Groq Vision to look at both images simultaneously.
   - Instructed strictly on the "Observation != Proof" rule (e.g., it can say "trees are taller", but cannot claim "the NGO saved the forest").
   - Returns structured JSON (categories of change, confidence score).
4. **Drafting Evidence:** User clicks "Draft as Evidence", sending a `POST /api/evidence`. The observation is queued for human verification in the `Evidence` tab.

#### How to Test
1. Go to the "Comparisons" tab.
2. Select a "Before" image (e.g., dry land) and an "After" image (e.g., same land with saplings).
3. Click "Analyze Impact" and observe the AI's objective assessment.
4. Click "Draft as Evidence", navigate to the "Evidence" tab, and see the claim pending human verification.

---

## 3. Goal: Make Media Searchable Through AI-Powered Semantic Discovery
**Requirement Map:** Find images not just by exact file name, but by concepts, tags, and semantic meaning.

### Built Feature: Pinecone Semantic Search Engine
Instead of basic keyword matching, the platform understands the *meaning* of the search query.

#### Execution Flow (Debugging Path)
1. **Frontend:** User types "Show me community participation" in `client/src/pages/Search.jsx`.
2. **API:** Sends `POST /api/search/semantic` with the query string.
3. **Controller (`search.controller.js` & `pinecone.js`):**
   - Uses LangChain + Google GenAI to convert the user's search string into a mathematical vector (embedding).
   - Queries the Pinecone database to find the closest matching vectors (images with similar conceptual meanings).
   - Fetches the matched `assetIds` from MongoDB and returns the images.

#### How to Test
1. Go to the "Search" tab.
2. Search for abstract concepts based on images you uploaded (e.g., "water infrastructure", "greenery", or "people working").
3. The system will return images even if those exact words were never manually typed into the system.

---

## 4. Goal: Generate Visual Reports, Summaries, and Campaign-Ready Content
**Requirement Map:** Turn the verified evidence into actionable documents and social media content for stakeholders.

### Built Feature: LangGraph AI Report & Campaign Generator
Compiles multiple pieces of verified evidence into a cohesive narrative.

#### Execution Flow (Debugging Path)
1. **Frontend:** User navigates to `client/src/pages/Reports.jsx`, selects a Project and the verified Evidence items to include.
2. **API:** User clicks "Generate AI Report" -> `POST /api/reports/generate`.
   - User clicks "Generate Campaign Post" -> `POST /api/reports/campaign`.
3. **AI Graph (`reportGeneratorGraph.js` & `campaignGenerator.js`):**
   - The backend aggregates all selected MongoDB evidence documents.
   - Feeds the structured evidence to Groq `llama-3.1-70b-versatile`.
   - Outputs a highly structured Markdown report (Executive Summary, Findings, Limitations) or a Social Media Campaign (Thread, Hashtags, Call to Action).

#### How to Test
1. Ensure you have "Verified" some evidence in the Evidence tab.
2. Go to the Reports tab.
3. Select your project and click the checkboxes next to the verified evidence.
4. Click "Generate AI Report". Watch as the AI synthesizes the raw observations into a professional impact report.
5. Click "Generate Campaign Post" to see the same data transformed into an engaging social media thread.

---

## 5. Goal: Preserve Traceability to Original Source Assets
**Requirement Map:** Reports and evidence must not hallucinate; they must link directly back to the raw field media.

### Built Feature: Source Linking Database Schema
Throughout the entire application, AI-generated text is strictly tethered to MongoDB `ObjectId` arrays referencing the original media.

#### Execution Flow (Debugging Path)
- In `evidence.model.js`, every piece of evidence contains an array of `sourceAssets` (IDs pointing to the Cloudinary assets).
- When a Report is generated, it retains the `evidenceIds` used to create it.
- **Traceability Chain:** Report -> Evidence -> Media Asset -> Original Cloudinary URL.
- **Testing this:** In the Evidence tab, every observation card includes a button/link mapping back to the "Source Assets" that were compared to generate that claim. 

---

## Debugging Quick Reference

If something breaks, follow this checklist based on the feature:

*   **Image not showing AI tags:** Check the backend Winston logs (`server/logs/combined.log`) for `Cloudinary Webhook` errors. Ensure ngrok is running and the webhook URL is correctly set in Cloudinary.
*   **Comparisons failing:** Check `compareImages.js`. Ensure the Groq API key is valid and you are passing `secureUrl` strings (not objects) into the prompt.
*   **Semantic Search returning nothing:** Ensure your Pinecone API key and Index Name are correct. The index dimension must be exactly `768` (Google GenAI text-embedding-004).
*   **Reports failing to generate:** Ensure the evidence IDs are actually being passed in the POST payload from `Reports.jsx`. Check the Network tab in your browser's dev tools.
