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
 *       description: Weather observation returned after backend transformations
 *       properties:
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-09-17T08:45:00+00:00"
 *         temperatureF:
 *           type: number
 *           example: 69.8
 *           description: Temperature in Fahrenheit
 *         relativeHumidity:
 *           type: number
 *           example: 88.35
 *           description: Relative humidity percentage
 *         windDirection:
 *           type: string
 *           example: "N"
 *           description: Wind direction in compass notation (N, NE, E, SE, S, SW, W, NW)
 *         windDirectionValue:
 *           type: number
 *           example: 180
 *           description: Actual numeric wind direction value from the API
 *         windSpeedMph:
 *           type: number
 *           example: 4.6
 *           description: Wind speed in miles per hour
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
