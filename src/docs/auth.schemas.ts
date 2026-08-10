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
 *     ForgotPassword:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *     VerifyOtp:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         otp:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *           pattern: "^[0-9]{6}$"
 *           example: "123456"
 *     ResetPassword:
 *       type: object
 *       required:
 *         - resetToken
 *         - password
 *         - confirmPassword
 *       properties:
 *         resetToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         password:
 *           type: string
 *           minLength: 8
 *           example: Password123
 *         confirmPassword:
 *           type: string
 *           example: Password123
 */
