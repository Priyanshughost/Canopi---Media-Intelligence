import { CarouselPost } from './carousel.model.js';
import { generateCarouselPost } from '../../services/carouselGenerator.js';
import { Report } from '../reports/report.model.js';

export const createProjectCarousel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { query, count, reportId } = req.body;

    console.log('[Carousel Controller] Generate Carousel requested for project', {
      projectId: id,
      query,
      count,
    });

    const carousel = await generateCarouselPost(id, { query, count, reportId });
    res.status(201).json(carousel);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const getProjectCarousel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const carousel = await CarouselPost.findOne({ projectId: id }).sort({ createdAt: -1 });

    if (!carousel) {
      return res.status(404).json({ error: 'No carousel post found for this project' });
    }

    res.json(carousel);
  } catch (error) {
    next(error);
  }
};

export const createReportCarousel = async (req, res, next) => {
  try {
    const { id } = req.params; // reportId
    const { query, count } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const carousel = await generateCarouselPost(report.projectId, {
      query,
      count,
      reportId: id,
    });
    res.status(201).json(carousel);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const getReportCarousel = async (req, res, next) => {
  try {
    const { id } = req.params; // reportId
    const carousel = await CarouselPost.findOne({ reportId: id }).sort({ createdAt: -1 });

    if (!carousel) {
      return res.status(404).json({ error: 'No carousel post found for this report' });
    }

    res.json(carousel);
  } catch (error) {
    next(error);
  }
};
