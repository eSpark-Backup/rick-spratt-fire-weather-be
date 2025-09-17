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
 *         - windSpeedMin
 *         - windSpeedMax
 *         - southDir
 *         - northDir
 *         - eastDir
 *         - westDir
 *         - northEastDir
 *         - northWestDir
 *         - southEastDir
 *         - southWestDir
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
 *         windSpeedMin:
 *           type: number
 *           description: Minimum wind speed threshold in Km/h
 *           example: 5
 *         windSpeedMax:
 *           type: number
 *           description: Maximum wind speed threshold in Km/h
 *           example: 25
 *         northEastDir:
 *           type: number
 *           description: North-East wind speed threshold in Km/h
 *           example: 75
 *         northWestDir:
 *           type: number
 *           description: North-West wind speed threshold in Km/h
 *           example: 75
 *         southEastDir:
 *           type: number
 *           description: South-East wind speed threshold in Km/h
 *           example: 75
 *         southWestDir:
 *           type: number
 *           description: South-West wind speed threshold in Km/h
 *           example: 75
 *
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
