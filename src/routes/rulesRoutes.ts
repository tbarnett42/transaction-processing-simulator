import { Router } from 'express';
import { rulesController } from '../controllers';

const router = Router();

// Rules configuration (must be before :id routes)
router.get('/config', rulesController.getConfig.bind(rulesController));
router.put('/config', rulesController.updateConfig.bind(rulesController));

// Reset rules
router.post('/reset', rulesController.resetRules.bind(rulesController));

// Rules CRUD
router.get('/', rulesController.getAllRules.bind(rulesController));
router.post('/', rulesController.createRule.bind(rulesController));
router.get('/:id', rulesController.getRule.bind(rulesController));
router.put('/:id', rulesController.updateRule.bind(rulesController));
router.delete('/:id', rulesController.deleteRule.bind(rulesController));

// Rule enable/disable
router.post('/:id/enable', rulesController.enableRule.bind(rulesController));
router.post('/:id/disable', rulesController.disableRule.bind(rulesController));

export default router;
