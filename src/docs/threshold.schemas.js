/**
 * @swagger
 * components:
 *   schemas:
 *     ThresholdRequest:        # <-- request now matches response shape exactly
 *       type: object
 *       required:
 *         - temperature
 *         - humidity
 *         - dispersion_index
 *         - wind_speed
 *       properties:
 *         temperature:
 *           type: number
 *           example: 80
 *         humidity:
 *           type: object
 *           required: [min, max]
 *           properties:          # <-- this line was misplaced
 *             min:
 *               type: number
 *               example: 40
 *             max:
 *               type: number
 *               example: 60
 *         dispersion_index:
 *           type: object
 *           required: [min, max]
 *           properties:          # <-- this line was misplaced
 *             min:
 *               type: number
 *               example: 40
 *             max:
 *               type: number
 *               example: 60
 *         wind_speed:
 *           type: object
 *           required: [N, NE, E, SE, S, SW, W, NW]
 *           properties:
 *             N:  { $ref: '#/components/schemas/WindDir' }
 *             NE: { $ref: '#/components/schemas/WindDir' }
 *             E:  { $ref: '#/components/schemas/WindDir' }
 *             SE: { $ref: '#/components/schemas/WindDir' }
 *             S:  { $ref: '#/components/schemas/WindDir' }
 *             SW: { $ref: '#/components/schemas/WindDir' }
 *             W:  { $ref: '#/components/schemas/WindDir' }
 *             NW: { $ref: '#/components/schemas/WindDir' }
 *
 *     WindDir:
 *       type: object
 *       required: [min, max]
 *       properties:
 *         min: { type: number, example: 10 }
 *         max: { type: number, example: 30 }
 *
 *     Threshold:               # same schema used for response
 *       allOf:
 *         - $ref: '#/components/schemas/ThresholdRequest'
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
