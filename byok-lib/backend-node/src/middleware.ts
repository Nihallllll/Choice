import type { Request, Response, NextFunction } from "express";
import { VALID_PROVIDERS, type BYOKRequest, type ProviderID } from "./types";

export function byokMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const provider = (req.headers["x-byok-provider"] as string | undefined)?.toLowerCase();

    if (!provider || !(VALID_PROVIDERS as readonly string[]).includes(provider)) {
      res.status(401).json({
        error: {
          message: `Invalid or missing provider. Must be one of: ${VALID_PROVIDERS.join(", ")}.`,
          code: "INVALID_PROVIDER",
        },
      });
      return;
    }

    let apiKey: string | undefined;
    if (req.body && typeof req.body === "object" && typeof req.body.api_key === "string") {
      apiKey = req.body.api_key;
    } else {
      apiKey = req.headers["x-byok-api-key"] as string | undefined;
    }

    if (!apiKey || apiKey.trim().length === 0) {
      res.status(401).json({
        error: {
          message: "Missing API key. Please configure your key in the app settings.",
          code: "NO_BYOK_KEY",
        },
      });
      return;
    }

    (req as BYOKRequest).byok = {
      provider: provider as ProviderID,
      apiKey: apiKey.trim(),
    };

    next();
  };
}
