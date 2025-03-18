import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { API_VERSION_HEADER, DEFAULT_VERSION } from './api-versioning.config';

/**
 * Middleware to add version information to API responses
 */
@Injectable()
export class VersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, nextFunction: NextFunction) {
    // Get the version from the request path or header
    const urlVersion = req.originalUrl.match(/\/api\/v(\d+)/)?.[1];
    const headerVersion = req.headers[API_VERSION_HEADER.toLowerCase()];
    
    // Determine which version to use (path version takes precedence over header)
    const version = urlVersion || headerVersion || DEFAULT_VERSION.version;
    
    // Add version header to the response
    res.setHeader(API_VERSION_HEADER, version);
    
    // Continue to the next middleware/handler
    nextFunction();
  }
}