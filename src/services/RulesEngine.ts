import { v4 as uuidv4 } from 'uuid';
import {
  Rule,
  RuleCondition,
  RuleEvaluationResult,
  RulesEngineConfig,
  RuleAction,
  RuleSeverity,
  DEFAULT_RULES,
  Transaction
} from '../models';
import { errorLogger } from './ErrorLogger';

// In-memory rules storage
const rules: Map<string, Rule> = new Map();

// Default configuration
const defaultConfig: RulesEngineConfig = {
  stopOnFirstDeny: true,
  logAllEvaluations: true,
  defaultAction: RuleAction.ALLOW
};

export class RulesEngine {
  private static instance: RulesEngine;
  private config: RulesEngineConfig;

  private constructor() {
    this.config = { ...defaultConfig };
    this.initializeDefaultRules();
  }

  static getInstance(): RulesEngine {
    if (!RulesEngine.instance) {
      RulesEngine.instance = new RulesEngine();
    }
    return RulesEngine.instance;
  }

  /**
   * Initialize with default rules
   */
  private initializeDefaultRules(): void {
    DEFAULT_RULES.forEach(ruleTemplate => {
      const rule: Rule = {
        ...ruleTemplate,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      rules.set(rule.id, rule);
    });
  }

  /**
   * Evaluate a single condition against a transaction
   */
  private evaluateCondition(condition: RuleCondition, transaction: Transaction): boolean {
    const { operator, value, field, children } = condition;

    // Handle composite conditions
    if (operator === 'AND' && children) {
      return children.every(child => this.evaluateCondition(child, transaction));
    }
    if (operator === 'OR' && children) {
      return children.some(child => this.evaluateCondition(child, transaction));
    }

    // Get the field value from transaction
    if (!field) return false;
    const fieldValue = transaction[field];

    // Evaluate based on operator
    switch (operator) {
      case 'EQ':
        return fieldValue === value;
      case 'NEQ':
        return fieldValue !== value;
      case 'GT':
        return typeof fieldValue === 'number' && fieldValue > (value as number);
      case 'GTE':
        return typeof fieldValue === 'number' && fieldValue >= (value as number);
      case 'LT':
        return typeof fieldValue === 'number' && fieldValue < (value as number);
      case 'LTE':
        return typeof fieldValue === 'number' && fieldValue <= (value as number);
      case 'IN':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'NOT_IN':
        return Array.isArray(value) && !value.includes(fieldValue);
      case 'MATCHES':
        return typeof fieldValue === 'string' && new RegExp(value as string).test(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Evaluate a single rule against a transaction
   */
  private evaluateRule(rule: Rule, transaction: Transaction): RuleEvaluationResult {
    const conditionMet = this.evaluateCondition(rule.condition, transaction);
    
    // For ALLOW rules, condition must be met to pass
    // For DENY/FLAG rules, condition being met means the rule triggers
    let passed: boolean;
    let message: string;

    if (rule.action === RuleAction.ALLOW) {
      passed = conditionMet;
      message = conditionMet 
        ? `Transaction passed rule: ${rule.name}`
        : `Transaction failed rule: ${rule.name}`;
    } else {
      // DENY, FLAG, REQUIRE_APPROVAL - condition met means rule triggered
      passed = !conditionMet;
      message = conditionMet
        ? `Rule triggered: ${rule.name} - ${rule.description}`
        : `Transaction passed rule check: ${rule.name}`;
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed,
      action: conditionMet ? rule.action : RuleAction.ALLOW,
      severity: rule.severity,
      message,
      evaluatedAt: new Date()
    };
  }

  /**
   * Evaluate all rules against a transaction
   */
  evaluateTransaction(transaction: Transaction): {
    allowed: boolean;
    results: RuleEvaluationResult[];
    flagged: boolean;
    requiresApproval: boolean;
    denyReason?: string;
  } {
    const activeRules = Array.from(rules.values())
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    const results: RuleEvaluationResult[] = [];
    let allowed = true;
    let flagged = false;
    let requiresApproval = false;
    let denyReason: string | undefined;

    for (const rule of activeRules) {
      const result = this.evaluateRule(rule, transaction);
      results.push(result);

      if (this.config.logAllEvaluations) {
        console.log(`Rule "${rule.name}" evaluated: ${result.passed ? 'PASSED' : 'TRIGGERED'}`);
      }

      if (!result.passed) {
        switch (result.action) {
          case RuleAction.DENY:
            allowed = false;
            denyReason = result.message;
            errorLogger.logRuleViolation(rule.name, result.message, transaction.id, {
              ruleId: rule.id,
              action: rule.action
            });
            if (this.config.stopOnFirstDeny) {
              return { allowed, results, flagged, requiresApproval, denyReason };
            }
            break;
          case RuleAction.FLAG:
            flagged = true;
            errorLogger.logRuleViolation(rule.name, result.message, transaction.id, {
              ruleId: rule.id,
              action: rule.action
            });
            break;
          case RuleAction.REQUIRE_APPROVAL:
            requiresApproval = true;
            break;
        }
      }
    }

    return { allowed, results, flagged, requiresApproval, denyReason };
  }

  /**
   * Add a new rule
   */
  addRule(rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Rule {
    const newRule: Rule = {
      ...rule,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    rules.set(newRule.id, newRule);
    return newRule;
  }

  /**
   * Update an existing rule
   */
  updateRule(id: string, updates: Partial<Omit<Rule, 'id' | 'createdAt'>>): Rule | null {
    const rule = rules.get(id);
    if (rule) {
      const updatedRule = {
        ...rule,
        ...updates,
        updatedAt: new Date()
      };
      rules.set(id, updatedRule);
      return updatedRule;
    }
    return null;
  }

  /**
   * Delete a rule
   */
  deleteRule(id: string): boolean {
    return rules.delete(id);
  }

  /**
   * Get a rule by ID
   */
  getRule(id: string): Rule | undefined {
    return rules.get(id);
  }

  /**
   * Get all rules
   */
  getAllRules(): Rule[] {
    return Array.from(rules.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(id: string, enabled: boolean): Rule | null {
    return this.updateRule(id, { enabled });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RulesEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RulesEngineConfig {
    return { ...this.config };
  }

  /**
   * Reset to default rules
   */
  resetToDefaults(): void {
    rules.clear();
    this.initializeDefaultRules();
  }
}

export const rulesEngine = RulesEngine.getInstance();
