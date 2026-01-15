import { rulesEngine } from '../RulesEngine';
import { RuleAction, RuleSeverity, Transaction, TransactionStatus, TransactionType, TransactionPriority } from '../../models';

describe('RulesEngine', () => {
  const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 'test-123',
    type: TransactionType.PAYMENT,
    status: TransactionStatus.PENDING,
    priority: TransactionPriority.NORMAL,
    amount: 100,
    currency: 'USD',
    sourceAccount: 'ACC-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    retryCount: 0,
    maxRetries: 3,
    ...overrides
  });

  beforeEach(() => {
    // Reset to default rules before each test
    rulesEngine.resetToDefaults();
  });

  describe('evaluateTransaction', () => {
    it('should allow normal transactions', () => {
      const transaction = createMockTransaction({ amount: 100, currency: 'USD' });
      const result = rulesEngine.evaluateTransaction(transaction);

      expect(result.allowed).toBe(true);
      expect(result.flagged).toBe(false);
    });

    it('should flag high amount transactions', () => {
      const transaction = createMockTransaction({ amount: 15000, currency: 'USD' });
      const result = rulesEngine.evaluateTransaction(transaction);

      expect(result.allowed).toBe(true);
      expect(result.flagged).toBe(true);
    });

    it('should deny very high amount transactions', () => {
      const transaction = createMockTransaction({ amount: 150000, currency: 'USD' });
      const result = rulesEngine.evaluateTransaction(transaction);

      expect(result.allowed).toBe(false);
      expect(result.denyReason).toContain('Very High Amount Block');
    });

    it('should deny transactions below minimum amount', () => {
      const transaction = createMockTransaction({ amount: 0.001, currency: 'USD' });
      const result = rulesEngine.evaluateTransaction(transaction);

      expect(result.allowed).toBe(false);
    });

    it('should return results for all evaluated rules', () => {
      const transaction = createMockTransaction({ amount: 500, currency: 'USD' });
      const result = rulesEngine.evaluateTransaction(transaction);

      expect(result.results.length).toBeGreaterThan(0);
      result.results.forEach(r => {
        expect(r.ruleId).toBeDefined();
        expect(r.ruleName).toBeDefined();
        expect(r.evaluatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('addRule', () => {
    it('should add a new rule', () => {
      const initialCount = rulesEngine.getAllRules().length;

      rulesEngine.addRule({
        name: 'Test Rule',
        description: 'A test rule',
        enabled: true,
        priority: 5,
        condition: {
          type: 'AMOUNT_THRESHOLD',
          operator: 'GT',
          value: 5000,
          field: 'amount'
        },
        action: RuleAction.FLAG,
        severity: RuleSeverity.INFO
      });

      expect(rulesEngine.getAllRules().length).toBe(initialCount + 1);
    });
  });

  describe('updateRule', () => {
    it('should update an existing rule', () => {
      const rules = rulesEngine.getAllRules();
      const ruleToUpdate = rules[0];

      const updated = rulesEngine.updateRule(ruleToUpdate.id, {
        description: 'Updated description'
      });

      expect(updated).not.toBeNull();
      expect(updated?.description).toBe('Updated description');
    });

    it('should return null for non-existent rule', () => {
      const updated = rulesEngine.updateRule('non-existent-id', {
        description: 'Updated'
      });

      expect(updated).toBeNull();
    });
  });

  describe('deleteRule', () => {
    it('should delete an existing rule', () => {
      const rules = rulesEngine.getAllRules();
      const ruleToDelete = rules[0];
      const initialCount = rules.length;

      const deleted = rulesEngine.deleteRule(ruleToDelete.id);

      expect(deleted).toBe(true);
      expect(rulesEngine.getAllRules().length).toBe(initialCount - 1);
    });

    it('should return false for non-existent rule', () => {
      const deleted = rulesEngine.deleteRule('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('setRuleEnabled', () => {
    it('should enable/disable a rule', () => {
      const rules = rulesEngine.getAllRules();
      const rule = rules[0];

      rulesEngine.setRuleEnabled(rule.id, false);
      expect(rulesEngine.getRule(rule.id)?.enabled).toBe(false);

      rulesEngine.setRuleEnabled(rule.id, true);
      expect(rulesEngine.getRule(rule.id)?.enabled).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      rulesEngine.updateConfig({ stopOnFirstDeny: false });
      const config = rulesEngine.getConfig();

      expect(config.stopOnFirstDeny).toBe(false);
    });

    it('should get current configuration', () => {
      const config = rulesEngine.getConfig();

      expect(config).toHaveProperty('stopOnFirstDeny');
      expect(config).toHaveProperty('logAllEvaluations');
      expect(config).toHaveProperty('defaultAction');
    });
  });
});
