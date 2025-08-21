/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - title
 *         - body
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           example: "b12d8a8f-7e1b-4c12-bc3e-4a1b0c9d5d1f"
 *         userId:
 *           type: string
 *           example: "c98f6b72-71c0-41ef-93e0-72e9d96c0c84"
 *         title:
 *           type: string
 *           example: "Weather Alert"
 *         body:
 *           type: string
 *           example: "Temperature exceeded 35°C"
 *         type:
 *           type: string
 *           example: "weather_alert"
 *         severity:
 *           type: string
 *           example: "high"
 *         isRead:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-08-21T14:22:05.123Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-08-21T14:25:30.456Z"
 *     NotificationsResponse:
 *       type: object
 *       properties:
 *         notifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *     NotificationResponse:
 *       type: object
 *       properties:
 *         notification:
 *           $ref: '#/components/schemas/Notification'
 */
