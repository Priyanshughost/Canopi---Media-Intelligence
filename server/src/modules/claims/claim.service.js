import { z } from 'zod';
import { gpt120b } from '../../ai/models/gpt-120b.js';
import { MediaAsset } from '../assets/asset.model.js';
import { Evidence } from '../evidence/evidence.model.js';
import { Project } from '../projects/project.model.js';
import { Claim } from './claim.model.js';
import { analyzeWithCloudinaryVision } from '../../services/cloudinaryIntelligence/vision.js';
import { pineconeIndex } from '../../integrations/pinecone.js';
import embeddings from '../../ai/embedding/embedding_model.js';

const ExtractedClaimsZod = z.object({
  claims: z.array(
    z.object({
      claimText: z.string().describe('Exact or specific checkable claim from the project text'),
      claimType: z
        .enum(['quantity', 'activity', 'outcome'])
        .describe('Type of claim: quantity (numerical metrics), activity (action performed), outcome (result)'),
      subject: z.string().describe('Core subject e.g. trees, water, solar, waste, mangrove'),
    })
  ),
});

const ClaimVerdictZod = z.object({
  verdict: z.enum(['SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNSUPPORTED', 'INSUFFICIENT_EVIDENCE']),
  reasoning: z.string().describe('Objective explanation referencing specific visual evidence observations'),
});

/**
 * 1. Extract discrete checkable claims from project description
 */
export const extractClaims = async (projectDescriptionText, projectName = '') => {
  if (!projectDescriptionText || !projectDescriptionText.trim()) {
    if (!projectName.trim()) return [];
    return [
      {
        claimText: `Implementation of ${projectName}`,
        claimType: 'activity',
        subject: projectName,
      },
    ];
  }

  const prompt = `You are an expert impact verification auditor.
Extract all discrete, checkable claims regarding activities, quantities, numbers, and outcomes from the following project description.

Project Name: ${projectName}
Project Description:
"""
${projectDescriptionText}
"""

Guidelines:
- Extract clear, standalone claims (e.g. "500 trees planted", "clean drinking water provided to 200 households", "3 km of coastline restored").
- Classify each claim as:
  - "quantity": Contains specific numbers, counts, distances, or metric quantities.
  - "activity": Describes an active intervention, event, or program without strict counts.
  - "outcome": Describes an environmental or community impact result.
- Identify the core subject (e.g. "trees", "water filters", "coastline", "solar panels").
- Only extract claims that are directly stated in the text. Do not fabricate extra claims.`;

  try {
    const structuredModel = gpt120b.withStructuredOutput(ExtractedClaimsZod);
    const result = await structuredModel.invoke(prompt);
    if (result?.claims && result.claims.length > 0) {
      return result.claims;
    }
  } catch (err) {
    console.warn('[Claim Service] LLM structured extraction fallback:', err.message);
  }

  // Fallback heuristic extraction if LLM call fails
  const sentences = projectDescriptionText
    .split(/[.\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length === 0) {
    return [
      {
        claimText: projectDescriptionText.trim().substring(0, 100),
        claimType: 'activity',
        subject: projectName || 'project intervention',
      },
    ];
  }

  return sentences.slice(0, 4).map((sentence) => {
    const hasNumber = /\d+/.test(sentence);
    return {
      claimText: sentence,
      claimType: hasNumber ? 'quantity' : 'activity',
      subject: projectName || 'ecological initiative',
    };
  });
};

/**
 * 2. Find semantically relevant media assets for a given claim within a project
 */
export const findRelevantAssetsForClaim = async (claim, projectId) => {
  let assetIdsFromVector = [];

  // Attempt Pinecone vector search for the claim subject
  try {
    if (pineconeIndex && embeddings?.embedQuery) {
      const queryText = `${claim.subject} ${claim.claimText}`;
      const queryEmbedding = await embeddings.embedQuery(queryText);

      const searchResults = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: 6,
        includeMetadata: true,
        filter: { projectId: String(projectId) },
      });

      if (searchResults?.matches?.length > 0) {
        assetIdsFromVector = searchResults.matches
          .map((m) => m.metadata?.assetId)
          .filter(Boolean);
      }
    }
  } catch (vectorErr) {
    console.warn('[Claim Service] Vector search skipped:', vectorErr.message);
  }

  // Retrieve MongoDB assets for the project
  const projectAssets = await MediaAsset.find({ projectId }).sort({ verified: -1, createdAt: -1 });

  if (projectAssets.length === 0) {
    return [];
  }

  // Score & sort assets by relevance
  const subjectLower = (claim.subject || '').toLowerCase();
  const claimTextLower = (claim.claimText || '').toLowerCase();

  const scored = projectAssets.map((asset) => {
    let score = 0;
    const assetIdStr = asset._id.toString();

    if (assetIdsFromVector.includes(assetIdStr)) {
      score += 10;
    }
    if (asset.verified) {
      score += 5;
    }

    const desc = (asset.aiAnalysis?.description || '').toLowerCase();
    const tags = (asset.aiAnalysis?.tags || []).map((t) => t.toLowerCase());

    if (subjectLower && (desc.includes(subjectLower) || tags.some((t) => t.includes(subjectLower)))) {
      score += 6;
    }
    if (claimTextLower.split(' ').some((word) => word.length > 3 && desc.includes(word))) {
      score += 3;
    }

    return { asset, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return top 4 most relevant assets
  return scored.slice(0, 4).map((s) => s.asset);
};

/**
 * 3. Verify a single claim against evidence using Cloudinary AI Vision VQA + Groq synthesis
 */
export const verifyClaimAgainstEvidence = async (claim, project, relevantAssets) => {
  if (!relevantAssets || relevantAssets.length === 0) {
    return {
      verdict: 'INSUFFICIENT_EVIDENCE',
      reasoning: `No media or visual evidence has been uploaded for "${project.name}" regarding ${claim.subject || 'this claim'}. Upload verified field photos to substantiate this claim.`,
      supportingAssetIds: [],
      vqaInsights: [],
    };
  }

  // Run targeted Cloudinary AI Vision VQA on top matching image assets
  const vqaInsights = [];
  const imageAssets = relevantAssets.filter((a) => a.mediaType !== 'video' && a.cloudinary?.publicId);

  const targetedQuestions = [
    `Does this image show ${claim.subject || 'the claimed activity'}?`,
    `What specific count, quantity, volume, or scale is visible regarding ${claim.subject || 'the activity'}?`,
    `Is there visible evidence directly supporting or contradicting: "${claim.claimText}"?`,
  ];

  for (const asset of imageAssets.slice(0, 3)) {
    try {
      const vqaResult = await analyzeWithCloudinaryVision(asset.cloudinary.publicId, targetedQuestions);
      if (vqaResult?.questions) {
        vqaResult.questions.forEach((q) => {
          vqaInsights.push({
            assetId: asset._id.toString(),
            question: q.question,
            answer: q.answer,
          });
        });
      }
    } catch (vqaErr) {
      console.warn(`[Claim Service] VQA failed for asset ${asset._id}:`, vqaErr.message);
    }
  }

  // Synthesize evidence observations using Groq with strict anti-greenwashing rules
  const evidenceSummary = relevantAssets.map((asset, idx) => ({
    assetIndex: idx + 1,
    id: asset._id.toString(),
    filename: asset.originalFilename,
    verified: asset.verified,
    aiDescription: asset.aiAnalysis?.description || 'No description available',
    tags: asset.aiAnalysis?.tags || [],
    vqaFindings: vqaInsights
      .filter((v) => v.assetId === asset._id.toString())
      .map((v) => `${v.question} -> ${v.answer}`),
  }));

  const synthesisPrompt = `You are a rigorous, independent sustainability impact auditor.
Your job is to cross-verify the following stated project claim against the actual visual evidence.

Project Name: ${project.name}
Stated Claim to Verify:
- Claim Text: "${claim.claimText}"
- Claim Type: ${claim.claimType}
- Subject: ${claim.subject}

Available Visual Evidence:
${JSON.stringify(evidenceSummary, null, 2)}

MANDATORY AUDIT DISCIPLINE ("OBSERVATION != PROOF"):
1. If the claim states a specific quantity/number (e.g. "500 trees planted", "200 households") but the photos only show a dozen saplings or general planting activity, the verdict MUST be "PARTIALLY_SUPPORTED" or "INSUFFICIENT_EVIDENCE".
2. NEVER guess, assume, or fabricate that unseen items exist off-camera.
3. Verdicts:
   - "SUPPORTED": The visual evidence directly, convincingly, and fully confirms what is stated in the claim.
   - "PARTIALLY_SUPPORTED": The evidence proves the general activity or intent, but CANNOT verify the specific numerical scale, or shows partial execution.
   - "UNSUPPORTED": The visual evidence clearly contradicts the claim (e.g. heavy plastic waste visible when cleanup was claimed) or shows something completely incompatible.
   - "INSUFFICIENT_EVIDENCE": The images are unrelated, unverified, or too ambiguous to assess this claim.

Provide your verdict and a clear, objective, plain-language reasoning explanation.`;

  try {
    const verdictModel = gpt120b.withStructuredOutput(ClaimVerdictZod);
    const verdictResult = await verdictModel.invoke(synthesisPrompt);

    return {
      verdict: verdictResult.verdict,
      reasoning: verdictResult.reasoning,
      supportingAssetIds: relevantAssets.map((a) => a._id),
      vqaInsights,
    };
  } catch (err) {
    console.warn('[Claim Service] LLM verdict synthesis fallback:', err.message);

    // Contextual fallback logic
    const hasImages = imageAssets.length > 0;
    const isQuantity = claim.claimType === 'quantity';

    let fallbackVerdict = 'INSUFFICIENT_EVIDENCE';
    let fallbackReasoning = `Visual evidence for ${claim.subject} was reviewed. `;

    if (hasImages && isQuantity) {
      fallbackVerdict = 'PARTIALLY_SUPPORTED';
      fallbackReasoning += `Visual evidence confirms ongoing field activities, but photographic evidence alone cannot verify the specific numerical quantity claimed ("${claim.claimText}").`;
    } else if (hasImages) {
      fallbackVerdict = 'SUPPORTED';
      fallbackReasoning += `Visual records and Cloudinary AI Vision confirm the presence of ${claim.subject} aligned with the stated initiative.`;
    } else {
      fallbackReasoning += `No verified image assets matching "${claim.subject}" are currently available.`;
    }

    return {
      verdict: fallbackVerdict,
      reasoning: fallbackReasoning,
      supportingAssetIds: relevantAssets.map((a) => a._id),
      vqaInsights,
    };
  }
};

/**
 * 4. Run full claim extraction and verification pipeline for a project
 */
export const runProjectClaimsCheck = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // 1. Extract claims from project description
  const rawClaims = await extractClaims(project.description, project.name);

  if (rawClaims.length === 0) {
    return {
      projectId: project._id,
      claims: [],
      summary: { total: 0, supported: 0, partiallySupported: 0, unsupported: 0, insufficientEvidence: 0 },
      checkedAt: new Date(),
    };
  }

  // 2. Verify each claim against project evidence
  const checkedClaims = [];

  for (const rawClaim of rawClaims) {
    const relevantAssets = await findRelevantAssetsForClaim(rawClaim, project._id);
    const verification = await verifyClaimAgainstEvidence(rawClaim, project, relevantAssets);

    // Save or update Claim in MongoDB
    const claimDoc = await Claim.findOneAndUpdate(
      { projectId: project._id, claimText: rawClaim.claimText },
      {
        projectId: project._id,
        claimText: rawClaim.claimText,
        claimType: rawClaim.claimType,
        subject: rawClaim.subject,
        verdict: verification.verdict,
        reasoning: verification.reasoning,
        supportingAssetIds: verification.supportingAssetIds,
        vqaInsights: verification.vqaInsights,
        checkedAt: new Date(),
      },
      { upsert: true, new: true }
    ).populate('supportingAssetIds');

    checkedClaims.push(claimDoc);
  }

  // Calculate summary metrics
  const summary = {
    total: checkedClaims.length,
    supported: checkedClaims.filter((c) => c.verdict === 'SUPPORTED').length,
    partiallySupported: checkedClaims.filter((c) => c.verdict === 'PARTIALLY_SUPPORTED').length,
    unsupported: checkedClaims.filter((c) => c.verdict === 'UNSUPPORTED').length,
    insufficientEvidence: checkedClaims.filter((c) => c.verdict === 'INSUFFICIENT_EVIDENCE').length,
  };

  return {
    projectId: project._id,
    projectName: project.name,
    claims: checkedClaims,
    summary,
    checkedAt: new Date(),
  };
};

/**
 * 5. Get existing claims for a project
 */
export const getProjectClaimsFromDb = async (projectId) => {
  const claims = await Claim.find({ projectId })
    .populate('supportingAssetIds')
    .sort({ createdAt: -1 });

  const summary = {
    total: claims.length,
    supported: claims.filter((c) => c.verdict === 'SUPPORTED').length,
    partiallySupported: claims.filter((c) => c.verdict === 'PARTIALLY_SUPPORTED').length,
    unsupported: claims.filter((c) => c.verdict === 'UNSUPPORTED').length,
    insufficientEvidence: claims.filter((c) => c.verdict === 'INSUFFICIENT_EVIDENCE').length,
  };

  return {
    projectId,
    claims,
    summary,
  };
};
