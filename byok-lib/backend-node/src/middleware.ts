import type { Request, Response, NextFunction } from "express";

/**
 * Express middleware — reads BYOK headers sent by the frontend library
 * and attaches them to `req.byok` for downstream use.
 *
 * Usage:
 *   app.use(byokMiddleware());
 *
 * Then in any route or LangChain pipeline:
 *   const { provider, apiKey } = req.byok;
 */
export function byokMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const provider = req.headers["x-byok-provider"] as string | undefined;

    // The user's actual LLM provider key is sent in the request body (api_key field)
    // for LiteLLM clientside_credentials. We also need it in middleware for
    // direct LangChain usage (non-LiteLLM-proxy path).
    //
    // Strategy: read from body if present, otherwise try a dedicated header.
    let apiKey: string | undefined;

    if (req.body && typeof req.body === "object" && req.body.api_key) {
      apiKey = req.body.api_key as string;
    } else {
      // Fallback: allow explicit header (useful for non-chat endpoints)
      apiKey = req.headers["x-byok-api-key"] as string | undefined;
    }

    if (!provider || !apiKey) {
      res.status(401).json({
        error: {
          message:
            "Missing API key configuration. Please configure your API key in the app settings.",
          code: "NO_BYOK_KEY",
        },
      });
      return;
    }

    // Attach to request so downstream handlers can use it
    (req as Request & { byok: { provider: string; apiKey: string } }).byok = {
      provider,
      apiKey,
    };

    next();
  };
}
