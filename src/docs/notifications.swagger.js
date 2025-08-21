/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: User notification endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: "Get all notifications for the logged-in user"
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Number of notifications per page
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationsResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: "Mark a notification as read or unread"
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "Notification ID"
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: "Delete a single notification"
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "Notification ID to delete"
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */

/**
 * @swagger
 * /api/notifications:
 *   delete:
 *     summary: "Clear all notifications for the logged-in user"
 *     tags:
 *       - Notifications
 *     responses:
 *       200:
 *         description: All notifications cleared successfully
 *       401:
 *         description: Unauthorized
 */
