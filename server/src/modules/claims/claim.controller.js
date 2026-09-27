import { runProjectClaimsCheck, getProjectClaimsFromDb } from './claim.service.js';

export const checkClaimsHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`[Claims Controller] Running consistency check for project ${id}`);
    const result = await runProjectClaimsCheck(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getClaimsHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getProjectClaimsFromDb(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
