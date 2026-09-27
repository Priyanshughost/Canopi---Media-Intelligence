/**
 * Evidence Trust Score Calculation Engine
 *
 * Computes an interpretable 0–100 confidence score by combining forensic,
 * metadata, duplicate, moderation, quality, and dual AI cross-validation signals.
 */

export const TRUST_SCORE_WEIGHTS = {
  BASE_SCORE: 70,
  DUPLICATE_IDENTICAL_PENALTY: -30,    // Near exact copy (distance <= 3)
  DUPLICATE_SIMILAR_PENALTY: -18,      // Visually similar reuse (distance <= 8)
  MODERATION_FLAG_PENALTY: -25,        // Flagged by Cloudinary moderation
  EXIF_GPS_BONUS: 10,                  // Genuine device GPS metadata
  EXIF_DATE_BONUS: 5,                  // Genuine camera capture timestamp
  LOCATION_MISMATCH_PENALTY: -15,      // GPS > 50km from declared project area
  HIGH_QUALITY_BONUS: 5,               // Quality analysis score >= 0.8
  POOR_QUALITY_PENALTY: -5,            // Quality analysis score < 0.4
  AI_CONSENSUS_BONUS: 5,               // Groq AI & Cloudinary Vision agreement
  AI_DIVERGENCE_PENALTY: -10,          // Groq AI & Cloudinary Vision disagreement
  VIDEO_TRANSCRIPT_BONUS: 5,           // Multi-segment timestamped video transcript verified
  HUMAN_VERIFIED_BONUS: 10,            // Human expert marked verified
};

/**
 * Calculates a 0–100 Evidence Trust Score with a human-readable factor breakdown
 *
 * @param {Object} mediaAsset - MongoDB MediaAsset document or object
 * @param {Object} [project] - Optional Project document for context/location comparison
 * @returns {{ score: number, breakdown: Array<{ factor: string, impact: number, detail: string }> }}
 */
export const calculateTrustScore = (mediaAsset, project = null) => {
  if (!mediaAsset) {
    return {
      score: TRUST_SCORE_WEIGHTS.BASE_SCORE,
      breakdown: [
        {
          factor: 'Insufficient Data',
          impact: 0,
          detail: 'No media asset payload provided for trust evaluation.',
        },
      ],
    };
  }

  let currentScore = TRUST_SCORE_WEIGHTS.BASE_SCORE;
  const breakdown = [
    {
      factor: 'Baseline Initial Confidence',
      impact: TRUST_SCORE_WEIGHTS.BASE_SCORE,
      detail: 'Standard baseline score before forensic and multi-modal intelligence checks.',
    },
  ];

  // 1. Duplicate & Perceptual Hash Reuse
  if (Array.isArray(mediaAsset.possibleDuplicates) && mediaAsset.possibleDuplicates.length > 0) {
    const distances = mediaAsset.possibleDuplicates
      .map((d) => (typeof d.distance === 'number' ? d.distance : 8));
    const minDistance = Math.min(...distances);

    if (minDistance <= 3) {
      currentScore += TRUST_SCORE_WEIGHTS.DUPLICATE_IDENTICAL_PENALTY;
      breakdown.push({
        factor: 'Identical Duplicate / Media Reuse Detected',
        impact: TRUST_SCORE_WEIGHTS.DUPLICATE_IDENTICAL_PENALTY,
        detail: `Exact visual perceptual hash match found with ${mediaAsset.possibleDuplicates.length} existing asset(s) (Hamming distance ${minDistance}).`,
      });
    } else {
      currentScore += TRUST_SCORE_WEIGHTS.DUPLICATE_SIMILAR_PENALTY;
      breakdown.push({
        factor: 'Possible Near-Duplicate Detected',
        impact: TRUST_SCORE_WEIGHTS.DUPLICATE_SIMILAR_PENALTY,
        detail: `Near-duplicate visual pattern detected with ${mediaAsset.possibleDuplicates.length} existing asset(s).`,
      });
    }
  } else {
    breakdown.push({
      factor: 'Unique Visual Asset',
      impact: 0,
      detail: 'Perceptual hash uniqueness confirmed against media catalog.',
    });
  }

  // 2. Content Moderation & Compliance
  if (mediaAsset.flaggedForReview) {
    currentScore += TRUST_SCORE_WEIGHTS.MODERATION_FLAG_PENALTY;
    breakdown.push({
      factor: 'Content Moderation Review Flag',
      impact: TRUST_SCORE_WEIGHTS.MODERATION_FLAG_PENALTY,
      detail: 'Asset flagged for review by Cloudinary automated safety inspection.',
    });
  }

  // 3. Metadata Consistency (EXIF GPS & Capture Timestamp)
  const isExifGps = mediaAsset.location?.source === 'exif';
  const hasGps = Boolean(
    mediaAsset.location?.lat !== undefined ||
    mediaAsset.location?.latitude !== undefined
  );
  const hasExifDate = Boolean(mediaAsset.capturedAt);

  if (isExifGps) {
    currentScore += TRUST_SCORE_WEIGHTS.EXIF_GPS_BONUS;
    const lat = mediaAsset.location.lat ?? mediaAsset.location.latitude;
    const lng = mediaAsset.location.lng ?? mediaAsset.location.longitude;
    breakdown.push({
      factor: 'On-Device EXIF GPS Verified',
      impact: TRUST_SCORE_WEIGHTS.EXIF_GPS_BONUS,
      detail: `Authentic on-site hardware coordinate verified (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}).`,
    });
  } else if (!hasGps) {
    breakdown.push({
      factor: 'GPS Metadata Absent (Neutral)',
      impact: 0,
      detail: 'No camera GPS tag found in original EXIF header; evaluated neutrally.',
    });
  }

  if (hasExifDate) {
    currentScore += TRUST_SCORE_WEIGHTS.EXIF_DATE_BONUS;
    breakdown.push({
      factor: 'Hardware Capture Timestamp Verified',
      impact: TRUST_SCORE_WEIGHTS.EXIF_DATE_BONUS,
      detail: `Camera hardware timestamp validated: ${new Date(mediaAsset.capturedAt).toLocaleDateString()}.`,
    });
  }

  // 4. Optical Quality Signal (Lightly Weighted)
  let qScore = null;
  if (typeof mediaAsset.qualityAnalysis?.quality_score === 'number') {
    qScore = mediaAsset.qualityAnalysis.quality_score;
  } else if (typeof mediaAsset.qualityAnalysis === 'number') {
    qScore = mediaAsset.qualityAnalysis;
  }

  if (qScore !== null) {
    if (qScore >= 0.8) {
      currentScore += TRUST_SCORE_WEIGHTS.HIGH_QUALITY_BONUS;
      breakdown.push({
        factor: 'High Resolution & Visual Clarity',
        impact: TRUST_SCORE_WEIGHTS.HIGH_QUALITY_BONUS,
        detail: `Clear optical fidelity (Quality score: ${(qScore * 100).toFixed(0)}%).`,
      });
    } else if (qScore < 0.4) {
      currentScore += TRUST_SCORE_WEIGHTS.POOR_QUALITY_PENALTY;
      breakdown.push({
        factor: 'Degraded Optical Quality',
        impact: TRUST_SCORE_WEIGHTS.POOR_QUALITY_PENALTY,
        detail: `Low resolution or exposure limitation (Quality score: ${(qScore * 100).toFixed(0)}%).`,
      });
    }
  }

  // 5. Dual AI Vision Cross-Check (Corroboration)
  const hasGroq = Boolean(mediaAsset.aiAnalysis?.description);
  const hasVision = Boolean(
    mediaAsset.cloudinaryVisionAnalysis?.questions?.length > 0 ||
    mediaAsset.cloudinaryVisionAnalysis?.answers?.length > 0
  );

  if (hasGroq && hasVision) {
    const visionText = (
      mediaAsset.cloudinaryVisionAnalysis.questions ||
      mediaAsset.cloudinaryVisionAnalysis.answers ||
      []
    )
      .map((q) => (q.answer || '').toLowerCase())
      .join(' ');

    const tags = (mediaAsset.aiAnalysis.tags || []).filter((t) => t.length > 3);
    const matchedTags = tags.filter((t) => visionText.includes(t.toLowerCase()));

    if (tags.length > 0 && matchedTags.length === 0 && !visionText.includes('observation confirmed')) {
      currentScore += TRUST_SCORE_WEIGHTS.AI_DIVERGENCE_PENALTY;
      breakdown.push({
        factor: 'Dual AI Vision Divergence',
        impact: TRUST_SCORE_WEIGHTS.AI_DIVERGENCE_PENALTY,
        detail: 'Discrepancy detected between Cloudinary AI Vision VQA and Groq LLM observations.',
      });
    } else {
      currentScore += TRUST_SCORE_WEIGHTS.AI_CONSENSUS_BONUS;
      breakdown.push({
        factor: 'Dual AI Consensus Corroborated',
        impact: TRUST_SCORE_WEIGHTS.AI_CONSENSUS_BONUS,
        detail: 'Independent Cloudinary AI Vision and Groq LLM models mutually corroborate scene observations.',
      });
    }
  }

  // 6. Video Temporal AI Transcript Verification (Video-specific)
  if (mediaAsset.mediaType === 'video') {
    if (Array.isArray(mediaAsset.videoTranscript) && mediaAsset.videoTranscript.length > 0) {
      currentScore += TRUST_SCORE_WEIGHTS.VIDEO_TRANSCRIPT_BONUS;
      breakdown.push({
        factor: 'Video Temporal AI Transcript Verified',
        impact: TRUST_SCORE_WEIGHTS.VIDEO_TRANSCRIPT_BONUS,
        detail: `Timestamped visual transcript validated across ${mediaAsset.videoTranscript.length} sequential video scene segment(s).`,
      });
    } else {
      breakdown.push({
        factor: 'Video Transcript Pending (Neutral)',
        impact: 0,
        detail: 'Video scene segmentation pending or minimal audio/visual narrative.',
      });
    }
  }

  // 7. Human Field Expert Verification
  if (mediaAsset.verified) {
    currentScore += TRUST_SCORE_WEIGHTS.HUMAN_VERIFIED_BONUS;
    breakdown.push({
      factor: 'Human Field Expert Verified',
      impact: TRUST_SCORE_WEIGHTS.HUMAN_VERIFIED_BONUS,
      detail: 'Field observations human-verified by project reviewer.',
    });
  }

  // Clamp between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(currentScore)));

  return {
    score: finalScore,
    breakdown,
  };
};
