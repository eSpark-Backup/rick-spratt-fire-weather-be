/**
 * @swagger
 * components:
 *   schemas:
 *     Threshold:
 *       type: object
 *       required:
 *         - temperature
 *         - humidity
 *         - windSpeed
 *         - southDir
 *         - northDir
 *         - eastDir
 *         - westDir
 *       properties:
 *         temperature:
 *           type: number
 *           description: Temperature threshold in °C
 *           example: 80
 *         humidity:
 *           type: number
 *           description: Relative humidity threshold in %
 *           example: 40
 *         windSpeed:
 *           type: number
 *           description: Wind speed threshold in Km/h
 *           example: 15
 *         southDir:
 *           type: number
 *           description: South wind speed threshold in Km/h
 *           example: 75
 *         northDir:
 *           type: number
 *           description: North wind speed threshold in Km/h
 *           example: 75
 *         eastDir:
 *           type: number
 *           description: East wind speed threshold in Km/h
 *           example: 75
 *         westDir:
 *           type: number
 *           description: West wind speed threshold in Km/h
 *           example: 75
 *
 *     ThresholdResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/Threshold'
 *         message:
 *           type: string
 *           example: Threshold fetched successfully
 */
