/**
 * Session routes for frontend API
 * Allows frontend to query session status and results
 */

import { Router, Request, Response } from 'express';
import { sessionStore } from '../services/sessionStore';

const router: Router = Router();

/**
 * GET /api/sessions/:sessionId
 * Get session status and data
 */
router.get('/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  const session = sessionStore.getSession(sessionId);
  
  if (!session) {
    res.status(404).json({ 
      error: 'SESSION_NOT_FOUND',
      message: 'Session not found or not yet processed'
    });
    return;
  }

  res.json(session);
});

/**
 * GET /api/sessions/:sessionId/result
 * Get session result (convenience endpoint)
 */
router.get('/:sessionId/result', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  const session = sessionStore.getSession(sessionId);
  
  if (!session) {
    res.status(404).json({ 
      error: 'SESSION_NOT_FOUND',
      message: 'Session not found or not yet processed'
    });
    return;
  }

  res.json({
    sessionId: session.sessionId,
    status: session.status,
    verifiedData: session.verifiedData,
    proofMetadata: session.proofMetadata,
    receivedAt: session.receivedAt
  });
});

/**
 * POST /api/sessions
 * Store session reference (optional - for tracking)
 */
router.post('/', (req: Request, res: Response) => {
  const { sessionId, sessionToken, createdAt } = req.body;
  
  if (!sessionId || !sessionToken) {
    res.status(400).json({
      error: 'INVALID_REQUEST',
      message: 'sessionId and sessionToken are required'
    });
    return;
  }

  // Store minimal session reference
  sessionStore.storeSession(sessionId, {
    sessionId,
    sessionToken, // Store securely in production!
    status: 'session_created',
    createdAt: createdAt || new Date().toISOString()
  });

  res.status(201).json({
    stored: true,
    sessionId
  });
});

/**
 * DELETE /api/sessions/:sessionId
 * Cleanup session data
 */
router.delete('/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  sessionStore.deleteSession(sessionId);
  
  res.json({ deleted: true, sessionId });
});

export { router as sessionRouter };