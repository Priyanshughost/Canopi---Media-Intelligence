import { Report } from './report.model.js';
import { Project } from '../projects/project.model.js';
import { Evidence } from '../evidence/evidence.model.js';
import { generateProjectReport, generateCampaignContent } from '../../ai/groq.js';
import { config } from '../../config/env.js';

export const generateReport = async (req, res, next) => {
  try {
    const { projectId, evidenceIds } = req.body;

    console.log('[Report Controller] Generation requested', { projectId, evidenceCount: evidenceIds?.length });

    if (!projectId || !evidenceIds || !evidenceIds.length) {
      return res.status(400).json({ error: 'projectId and evidenceIds are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Only fetch verified evidence
    const evidenceData = await Evidence.find({
      _id: { $in: evidenceIds },
      verified: true
    });

    if (evidenceData.length === 0) {
      return res.status(400).json({ error: 'No verified evidence provided for the report' });
    }

    console.log(`[Report Controller] Generating report for project ${projectId} using Groq`);
    const reportContent = await generateProjectReport(project, evidenceData);

    const report = await Report.create({
      projectId,
      title: reportContent.title,
      executiveSummary: reportContent.executiveSummary,
      keyFindings: reportContent.keyFindings,
      limitations: reportContent.limitations,
      evidenceUsed: evidenceIds,
      generatedBy: {
        provider: 'Groq',
        model: config.ai.groqModel || 'llama3-8b-8192'
      }
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
    const { projectId, evidenceId } = req.body;
    
    console.log('[Report Controller] Campaign generation requested', { projectId, evidenceId });

    const project = await Project.findById(projectId);
    const evidence = await Evidence.findById(evidenceId);
    
    if (!project || !evidence) {
      return res.status(404).json({ error: 'Project or Evidence not found' });
    }
    
    if (!evidence.verified) {
      return res.status(400).json({ error: 'Cannot generate campaign content from unverified evidence' });
    }
    
    const content = await generateCampaignContent(project, evidence);
    
    res.json({ content });
  } catch (error) {
    next(error);
  }
};
