/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VALIDATING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PAYMENT, TRANSFER, WITHDRAWAL, DEPOSIT, REFUND]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 pagination:
 *                   type: object
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionRequest'
 *           example:
 *             type: PAYMENT
 *             amount: 150.00
 *             currency: USD
 *             sourceAccount: ACC-001
 *             destinationAccount: ACC-002
 *             description: Test payment
 *     responses:
 *       201:
 *         description: Transaction created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *
 * /api/transactions/stats:
 *   get:
 *     summary: Get transaction statistics
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Transaction statistics
 *
 * /api/transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 *
 * /api/transactions/{id}/process:
 *   post:
 *     summary: Process a pending transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction processed
 *
 * /api/transactions/{id}/cancel:
 *   post:
 *     summary: Cancel a transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction cancelled
 *
 * /api/transactions/{id}/retry:
 *   post:
 *     summary: Retry a failed transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction retry initiated
 *
 * /api/transactions/{id}/refund:
 *   post:
 *     summary: Refund a completed transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction refunded
 */

/**
 * @swagger
 * /api/rules:
 *   get:
 *     summary: Get all rules
 *     tags: [Rules]
 *     parameters:
 *       - in: query
 *         name: enabled
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of rules
 *   post:
 *     summary: Create a new rule
 *     tags: [Rules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, condition]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               condition:
 *                 type: object
 *               action:
 *                 type: string
 *                 enum: [ALLOW, DENY, FLAG, REQUIRE_APPROVAL]
 *               severity:
 *                 type: string
 *                 enum: [INFO, WARNING, ERROR, CRITICAL]
 *               priority:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Rule created
 *
 * /api/rules/{id}:
 *   get:
 *     summary: Get a rule by ID
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule details
 *   put:
 *     summary: Update a rule
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule updated
 *   delete:
 *     summary: Delete a rule
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule deleted
 */

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: Get all webhooks
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of webhooks
 *   post:
 *     summary: Create a new webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, url, events]
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *                 format: uri
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               secret:
 *                 type: string
 *     responses:
 *       201:
 *         description: Webhook created
 *
 * /api/webhooks/events:
 *   get:
 *     summary: Get available webhook events
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available events
 */

/**
 * @swagger
 * /api/batch/transactions:
 *   post:
 *     summary: Create multiple transactions
 *     tags: [Batch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactions]
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateTransactionRequest'
 *     responses:
 *       201:
 *         description: Batch creation result
 *
 * /api/batch/process:
 *   post:
 *     summary: Process multiple transactions
 *     tags: [Batch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionIds]
 *             properties:
 *               transactionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Batch processing result
 *
 * /api/batch/process-pending:
 *   post:
 *     summary: Process all pending transactions
 *     tags: [Batch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Pending transactions processed
 */

/**
 * @swagger
 * /api/errors:
 *   get:
 *     summary: Get all error logs
 *     tags: [Errors]
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [DEBUG, INFO, WARNING, ERROR, CRITICAL]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: resolved
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of error logs
 *
 * /api/errors/stats:
 *   get:
 *     summary: Get error statistics
 *     tags: [Errors]
 *     responses:
 *       200:
 *         description: Error statistics
 *
 * /api/errors/{id}/resolve:
 *   post:
 *     summary: Mark an error as resolved
 *     tags: [Errors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resolvedBy]
 *             properties:
 *               resolvedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Error resolved
 */

export {};
