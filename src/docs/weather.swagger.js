/**
 * @swagger
 * tags:
 *   - name: Weather
 *     description: Weather and Zone endpoints
 */

/**
 * @swagger
 * /api/weather/zones:
 *   get:
 *     summary: "Get zones for a specific state and type"
 *     tags:
 *       - Weather
 *     parameters:
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *           default: FL
 *         description: "State area code (default is FL)"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           default: fire
 *           enum: [land, marine, forecast, public, coastal, offshore, fire, county]
 *         description: "Zone type (default is fire)"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: "Enter page number"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "Limit the number of results"
 *       - in: query
 *         name: effective
 *         schema:
 *           type: string
 *           format: date-time
 *         description: "Effective date/time filter"
 *     responses:
 *       200:
 *         description: Zones fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ZonesResponse'
 *       400:
 *         description: Validation error
 *       502:
 *         description: Weather API error
 */

/**
 * @swagger
 * /api/weather/zones/forecast/{zoneId}/observations:
 *   get:
 *     summary: "Get full weather observation data for a specific zone"
 *     tags:
 *       - Weather
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID of the zone"
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: "Start date/time"
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: "End date/time"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: "Enter page number"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "Limit the number of results"
 *     responses:
 *       200:
 *         description: Weather data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeatherResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: No weather data found for the specified zone
 *       502:
 *         description: Weather API error
 */
