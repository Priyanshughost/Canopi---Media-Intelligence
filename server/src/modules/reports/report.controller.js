import { Report } from './report.model.js';
import { Project } from '../projects/project.model.js';
import { Evidence } from '../evidence/evidence.model.js';
import { generateProjectReport, generateCampaignContent } from '../../ai/groq.js';
import { config } from '../../config/env.js';

/**
 * Selects the optimal visual derivative for an asset
 * Prefers Cloudinary report_crop (16:9) or enhanced versions over raw original
 */
export const selectBestVisualForAsset = (asset) => {
  if (!asset) return null;

  // 1. Check derivatives: prefer report_crop (16:9) or enhanced
  if (Array.isArray(asset.derivatives) && asset.derivatives.length > 0) {
    const reportCrop = asset.derivatives.find((d) => d.purpose === 'report_crop');
    if (reportCrop && reportCrop.url) {
      return {
        url: reportCrop.url,
        transformation: reportCrop.transformation || 'c_fill,ar_16:9,g_auto,w_1200',
        purpose: 'report_crop',
        sourceAssetId: asset._id,
        originalFilename: asset.originalFilename,
        location: asset.location,
      };
    }

    const enhanced = asset.derivatives.find((d) => d.purpose === 'enhanced');
    if (enhanced && enhanced.url) {
      return {
        url: enhanced.url,
        transformation: enhanced.transformation || 'e_gen_restore',
        purpose: 'enhanced',
        sourceAssetId: asset._id,
        originalFilename: asset.originalFilename,
        location: asset.location,
      };
    }
  }

  // 2. Check enhancedVersion directly
  if (asset.enhancedVersion) {
    return {
      url: asset.enhancedVersion,
      transformation: 'e_gen_restore',
      purpose: 'enhanced',
      sourceAssetId: asset._id,
      originalFilename: asset.originalFilename,
      location: asset.location,
    };
  }

  // 3. Fallback to original Cloudinary secureUrl
  return {
    url: asset.cloudinary?.secureUrl || null,
    transformation: 'original',
    purpose: 'original',
    sourceAssetId: asset._id,
    originalFilename: asset.originalFilename,
    location: asset.location,
  };
};

export const generateReport = async (req, res, next) => {
  try {
    const { projectId, evidenceIds } = req.body;

    console.log('[Report Controller] Generation requested', {
      projectId,
      evidenceCount: evidenceIds?.length,
    });

    if (!projectId || !evidenceIds || !evidenceIds.length) {
      return res.status(400).json({ error: 'projectId and evidenceIds are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Only fetch verified evidence with populated source assets
    const evidenceData = await Evidence.find({
      _id: { $in: evidenceIds },
      verified: true,
    }).populate('sourceAssets');

    if (evidenceData.length === 0) {
      return res.status(400).json({ error: 'No verified evidence provided for the report' });
    }

    console.log(`[Report Controller] Generating report for project ${projectId} using Groq`);
    const reportContent = await generateProjectReport(project, evidenceData);

    // 1. Gather all best visuals from evidence items
    const availableVisuals = [];
    evidenceData.forEach((ev) => {
      if (Array.isArray(ev.sourceAssets)) {
        ev.sourceAssets.forEach((asset) => {
          const visual = selectBestVisualForAsset(asset);
          if (visual && visual.url) {
            availableVisuals.push({
              ...visual,
              evidenceTitle: ev.title,
              evidenceType: ev.type,
            });
          }
        });
      }
    });

    // 2. Construct Structured Visual Report Blocks
    const reportBlocks = [];

    // Block: Title & Executive Summary
    reportBlocks.push({
      type: 'heading',
      headingLevel: 1,
      content: reportContent.title,
    });

    reportBlocks.push({
      type: 'callout',
      content: reportContent.executiveSummary,
      caption: 'Executive Impact Summary',
    });

    // Block: Key Findings with Embedded Evidence Images
    if (Array.isArray(reportContent.keyFindings)) {
      reportContent.keyFindings.forEach((finding, idx) => {
        reportBlocks.push({
          type: 'heading',
          headingLevel: 2,
          content: `Key Finding ${idx + 1}: ${finding.split('.')[0]}`,
        });

        // Attach best available visual asset for this finding if available
        const visual = availableVisuals[idx % (availableVisuals.length || 1)];
        if (visual && visual.url) {
          const locStr = visual.location?.name || (visual.location?.lat ? `${visual.location.lat.toFixed(3)}, ${visual.location.lng?.toFixed(3)}` : null);
          const captionParts = [
            `Verified Evidence: ${visual.originalFilename || visual.evidenceTitle}`,
            visual.purpose === 'report_crop' ? 'Cloudinary 16:9 Report Crop' : visual.purpose === 'enhanced' ? 'AI Generative Restored' : null,
            locStr ? `Location: ${locStr}` : null,
          ].filter(Boolean);

          reportBlocks.push({
            type: 'image',
            url: visual.url,
            caption: captionParts.join(' • '),
            sourceAssetId: visual.sourceAssetId,
            transformation: visual.transformation,
            purpose: visual.purpose,
          });
        }

        reportBlocks.push({
          type: 'text',
          content: finding,
        });
      });
    }

    // Block: Limitations & Methodology
    if (reportContent.limitations) {
      reportBlocks.push({
        type: 'heading',
        headingLevel: 3,
        content: 'Observation & Methodology Limitations',
      });
      reportBlocks.push({
        type: 'text',
        content: reportContent.limitations,
      });
    }

    const report = await Report.create({
      projectId,
      title: reportContent.title,
      executiveSummary: reportContent.executiveSummary,
      keyFindings: reportContent.keyFindings,
      limitations: reportContent.limitations,
      evidenceUsed: evidenceIds,
      reportBlocks,
      generatedBy: {
        provider: 'Groq',
        model: config.ai.groqModel || 'llama3-8b-8192',
      },
    });

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const filter = projectId ? { projectId } : {};

    console.log('[Report Controller] Fetching reports', { filter });

    const reports = await Report.find(filter)
      .populate('projectId', 'name')
      .populate('evidenceUsed', 'title')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    next(error);
  }
};

export const generateCampaign = async (req, res, next) => {
  try {
    const { projectId, evidenceId, reportId } = req.body;

    console.log('[Report Controller] Campaign generation requested', {
      projectId,
      evidenceId,
      reportId,
    });

    if (!reportId) {
      return res.status(400).json({ error: 'reportId is required' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const project = await Project.findById(projectId);
    const evidence = await Evidence.findById(evidenceId).populate('sourceAssets');

    if (!project || !evidence) {
      return res.status(404).json({ error: 'Project or Evidence not found' });
    }

    if (!evidence.verified) {
      return res.status(400).json({
        error: 'Cannot generate campaign content from unverified evidence',
      });
    }

    const content = await generateCampaignContent(project, evidence);

    // Pick best visual from evidence
    let bestVisual = null;
    if (Array.isArray(evidence.sourceAssets) && evidence.sourceAssets.length > 0) {
      bestVisual = selectBestVisualForAsset(evidence.sourceAssets[0]);
    }

    // Build platform-ready campaign post items
    const campaignPosts = [
      {
        platform: 'LinkedIn',
        headline: `${project.name} Verified Impact Update`,
        caption: content,
        suggestedImageUrl: bestVisual?.url || null,
        sourceAssetId: bestVisual?.sourceAssetId || null,
        transformation: bestVisual?.transformation || null,
        hashtags: ['ImpactVerification', 'Sustainability', 'CanopiPlatform'],
      },
      {
        platform: 'Twitter / X',
        headline: `Field Observation Verified`,
        caption:
          content.length > 240
            ? content.slice(0, 240) + '... #Impact #ESG'
            : `${content} #Impact #ESG`,
        suggestedImageUrl: bestVisual?.url || null,
        sourceAssetId: bestVisual?.sourceAssetId || null,
        transformation: bestVisual?.transformation || null,
        hashtags: ['ClimateAction', 'Transparency', 'VerifiedProof'],
      },
    ];

    // Persist the campaign content & visual posts to the report
    report.campaignContent = content;
    report.campaignPosts = campaignPosts;
    await report.save();

    res.json({
      content,
      campaignPosts,
      report,
    });
  } catch (error) {
    next(error);
  }
};
