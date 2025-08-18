/**
 * @swagger
 * components:
 *   schemas:
 *     Threshold:
 *       type: object
 *       required:
 *         - tempMin
 *         - tempMax
 *         - rhMin
 *         - rhMax
 *         - windMin
 *         - windMax
 *       properties:
 *         tempMin:
 *           type: number
 *           description: Minimum temperature threshold in °C
 *           example: -5
 *         tempMax:
 *           type: number
 *           description: Maximum temperature threshold in °C
 *           example: 35
 *         rhMin:
 *           type: number
 *           description: Minimum relative humidity threshold in %
 *           example: 20
 *         rhMax:
 *           type: number
 *           description: Maximum relative humidity threshold in %
 *           example: 80
 *         windMin:
 *           type: number
 *           description: Minimum wind speed threshold in m/s
 *           example: 5
 *         windMax:
 *           type: number
 *           description: Maximum wind speed threshold in m/s
 *           example: 25
 *
 *     ThresholdResponse:
 *       type: object
 *       properties:
 *         threshold:
 *           $ref: '#/components/schemas/Threshold'
 */
