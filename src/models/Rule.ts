import { Transaction, TransactionType } from './Transaction';

// Rule Severity
export enum RuleSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Rule Action
export enum RuleAction {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  FLAG = 'FLAG',
  REQUIRE_APPROVAL = 'REQUIRE_APPROVAL'
}

// Rule Definition
export interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // Lower number = higher priority
  condition: RuleCondition;
  action: RuleAction;
  severity: RuleSeverity;
  createdAt: Date;
  updatedAt: Date;
}

// Rule Condition Types
export type RuleConditionType = 
  | 'AMOUNT_THRESHOLD'
  | 'TRANSACTION_TYPE'
  | 'CURRENCY'
  | 'ACCOUNT_PATTERN'
  | 'TIME_WINDOW'
  | 'FREQUENCY'
  | 'COMPOSITE';

// Rule Condition
export interface RuleCondition {
  type: RuleConditionType;
  operator: 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'IN' | 'NOT_IN' | 'MATCHES' | 'AND' | 'OR';
  value: unknown;
  field?: keyof Transaction;
  children?: RuleCondition[]; // For composite conditions
}

// Rule Evaluation Result
export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  action: RuleAction;
  severity: RuleSeverity;
  message: string;
  evaluatedAt: Date;
}

// Rules Engine Configuration
export interface RulesEngineConfig {
  stopOnFirstDeny: boolean;
  logAllEvaluations: boolean;
  defaultAction: RuleAction;
}

// Predefined Rule Templates
export const DEFAULT_RULES: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'High Amount Threshold',
    description: 'Flag transactions over $10,000',
    enabled: true,
    priority: 1,
    condition: {
      type: 'AMOUNT_THRESHOLD',
      operator: 'GT',
      value: 10000,
      field: 'amount'
    },
    action: RuleAction.FLAG,
    severity: RuleSeverity.WARNING
  },
  {
    name: 'Very High Amount Block',
    description: 'Block transactions over $100,000',
    enabled: true,
    priority: 0,
    condition: {
      type: 'AMOUNT_THRESHOLD',
      operator: 'GT',
      value: 100000,
      field: 'amount'
    },
    action: RuleAction.DENY,
    severity: RuleSeverity.CRITICAL
  },
  {
    name: 'Minimum Amount',
    description: 'Reject transactions below $0.01',
    enabled: true,
    priority: 0,
    condition: {
      type: 'AMOUNT_THRESHOLD',
      operator: 'LT',
      value: 0.01,
      field: 'amount'
    },
    action: RuleAction.DENY,
    severity: RuleSeverity.ERROR
  },
  {
    name: 'Supported Currencies',
    description: 'Only allow USD, EUR, GBP currencies',
    enabled: true,
    priority: 2,
    condition: {
      type: 'CURRENCY',
      operator: 'IN',
      value: ['USD', 'EUR', 'GBP'],
      field: 'currency'
    },
    action: RuleAction.ALLOW,
    severity: RuleSeverity.INFO
  }
];
