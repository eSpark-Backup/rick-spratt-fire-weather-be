/**
 * @swagger
 * components:
 *   schemas:
 *     SignUp:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *         - confirmPassword
 *         - country
 *         - state
 *         - zoneId
 *         - deviceToken
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         confirmPassword:
 *           type: string
 *         country:
 *           type: string
 *           default: "US"
 *         state:
 *           type: string
 *           default: "Florida"
 *         zoneId:
 *           type: string
 *           default: "FLZ139"  # Example FL zone
 *         deviceToken:
 *           type: string
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     UpdateZone:
 *       type: object
 *       required:
 *         - zoneId
 *       properties:
 *         zoneId:
 *           type: string
 *           example: "FLZ139"
 *     UpdateDeviceToken:
 *       type: object
 *       required:
 *         - deviceToken
 *       properties:
 *         deviceToken:
 *           type: string
 *           example: "fcm_device_token_here"
 */
