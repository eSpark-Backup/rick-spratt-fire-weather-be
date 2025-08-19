/**
 * @swagger
 * components:
 *   schemas:
 *     Zone:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - type
 *         - state
 *         - effectiveDate
 *         - expirationDate
 *       properties:
 *         id:
 *           type: string
 *           example: FLZ008
 *         name:
 *           type: string
 *           example: Central Walton
 *         type:
 *           type: string
 *           example: fire
 *         state:
 *           type: string
 *           example: FL
 *         effectiveDate:
 *           type: string
 *           format: date-time
 *           example: "2025-03-18T18:00:00+00:00"
 *         expirationDate:
 *           type: string
 *           format: date-time
 *           example: "2200-01-01T00:00:00+00:00"
 *     WeatherObservation:
 *       type: object
 *       description: All weather variables from NWS API
 *       properties:
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-08-13T13:35:25.994Z"
 *         temperature:
 *           type: number
 *           example: 27
 *         temperatureUnit:
 *           type: string
 *           example: "C"
 *         windSpeed:
 *           type: number
 *           example: 9.25
 *         windDirection:
 *           type: number
 *           example: 170
 *         windGust:
 *           type: number
 *           example: 15
 *         relativeHumidity:
 *           type: number
 *           example: 89
 *         textDescription:
 *           type: string
 *           example: "Clear"
 *     ZonesResponse:
 *       type: object
 *       properties:
 *         zones:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Zone'
 *     WeatherResponse:
 *       type: object
 *       properties:
 *         weather:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WeatherObservation'
 */
