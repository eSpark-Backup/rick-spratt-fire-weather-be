/**
 * @swagger
 * tags:
 *   - name: Threshold
 *     description: Threshold management endpoints
 */

/**
 * @swagger
 * /api/threshold:
 *   get:
 *     summary: "Get the current threshold values"
 *     tags:
 *       - Threshold
 *     responses:
 *       200:
 *         description: Threshold fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ThresholdResponse'
 *       404:
 *         description: No threshold found
 *
 *   post:
 *     summary: "Create or update the threshold"
 *     tags:
 *       - Threshold
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Threshold'
 *     responses:
 *       200:
 *         description: Threshold created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ThresholdResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: No threshold found
 */
