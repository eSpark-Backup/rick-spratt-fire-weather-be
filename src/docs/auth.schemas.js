/**
 * @swagger
 * components:
 *   schemas:
 *     SignUp:
 *       type: object
 *       required:
 *         - first_name
 *         - last_name
 *         - email
 *         - password
 *         - confirm_password
 *         - country
 *         - state
 *         - zone
 *       properties:
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         confirm_password:
 *           type: string
 *         country:
 *           type: string
 *           default: "US"
 *         state:
 *           type: string
 *           default: "Florida"
 *         zone:
 *           type: string
 *           default: "Miami"  # Example FL zone
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
 */
