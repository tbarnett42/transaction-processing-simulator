import { Request, Response, NextFunction } from 'express';
import { rulesEngine } from '../services';
import { Rule, RuleAction, RuleSeverity } from '../models';

/**
 * Rules Controller - Handles all rule management HTTP requests
 */
export class RulesController {
  /**
   * Get all rules
   * GET /api/rules
   */
  async getAllRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { enabled } = req.query;
      let rules = rulesEngine.getAllRules();

      if (enabled !== undefined) {
        const isEnabled = enabled === 'true';
        rules = rules.filter(r => r.enabled === isEnabled);
      }

      res.json({
        success: true,
        data: rules,
        count: rules.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single rule by ID
   * GET /api/rules/:id
   */
  async getRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const rule = rulesEngine.getRule(id);

      if (!rule) {
        res.status(404).json({
          error: 'Rule not found'
        });
        return;
      }

      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new rule
   * POST /api/rules
   */
  async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ruleData = req.body;

      // Validate required fields
      if (!ruleData.name || !ruleData.condition) {
        res.status(400).json({
          error: 'Name and condition are required'
        });
        return;
      }

      // Set defaults
      const rule = rulesEngine.addRule({
        name: ruleData.name,
        description: ruleData.description || '',
        enabled: ruleData.enabled ?? true,
        priority: ruleData.priority ?? 10,
        condition: ruleData.condition,
        action: ruleData.action || RuleAction.FLAG,
        severity: ruleData.severity || RuleSeverity.WARNING
      });

      res.status(201).json({
        success: true,
        data: rule,
        message: 'Rule created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a rule
   * PUT /api/rules/:id
   */
  async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const rule = rulesEngine.updateRule(id, updates);

      if (!rule) {
        res.status(404).json({
          error: 'Rule not found'
        });
        return;
      }

      res.json({
        success: true,
        data: rule,
        message: 'Rule updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a rule
   * DELETE /api/rules/:id
   */
  async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = rulesEngine.deleteRule(id);

      if (!deleted) {
        res.status(404).json({
          error: 'Rule not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Rule deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enable a rule
   * POST /api/rules/:id/enable
   */
  async enableRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const rule = rulesEngine.setRuleEnabled(id, true);

      if (!rule) {
        res.status(404).json({
          error: 'Rule not found'
        });
        return;
      }

      res.json({
        success: true,
        data: rule,
        message: 'Rule enabled'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable a rule
   * POST /api/rules/:id/disable
   */
  async disableRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const rule = rulesEngine.setRuleEnabled(id, false);

      if (!rule) {
        res.status(404).json({
          error: 'Rule not found'
        });
        return;
      }

      res.json({
        success: true,
        data: rule,
        message: 'Rule disabled'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rules engine configuration
   * GET /api/rules/config
   */
  async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = rulesEngine.getConfig();

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update rules engine configuration
   * PUT /api/rules/config
   */
  async updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = req.body;
      rulesEngine.updateConfig(config);

      res.json({
        success: true,
        data: rulesEngine.getConfig(),
        message: 'Configuration updated'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset rules to defaults
   * POST /api/rules/reset
   */
  async resetRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      rulesEngine.resetToDefaults();

      res.json({
        success: true,
        data: rulesEngine.getAllRules(),
        message: 'Rules reset to defaults'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const rulesController = new RulesController();
