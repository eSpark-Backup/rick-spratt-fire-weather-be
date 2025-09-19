/**
 * @swagger
 * components:
 *   schemas:
 *     # Request body schema (plain fields)
 *     ThresholdRequest:
 *       type: object
 *       required:
 *         - temperature
 *         - humidity
 *         - northDirMin
 *         - northDirMax
 *         - southDirMin
 *         - southDirMax
 *         - eastDirMin
 *         - eastDirMax
 *         - westDirMin
 *         - westDirMax
 *         - northEastDirMin
 *         - northEastDirMax
 *         - northWestDirMin
 *         - northWestDirMax
 *         - southEastDirMin
 *         - southEastDirMax
 *         - southWestDirMin
 *         - southWestDirMax
 *       properties:
 *         temperature:
 *           type: number
 *           example: 80
 *         humidity:
 *           type: number
 *           example: 40
 *         northDirMin:
 *           type: number
 *           example: 20
 *         northDirMax:
 *           type: number
 *           example: 50
 *         southDirMin:
 *           type: number
 *           example: 25
 *         southDirMax:
 *           type: number
 *           example: 55
 *         eastDirMin:
 *           type: number
 *           example: 10
 *         eastDirMax:
 *           type: number
 *           example: 30
 *         westDirMin:
 *           type: number
 *           example: 20
 *         westDirMax:
 *           type: number
 *           example: 40
 *         northEastDirMin:
 *           type: number
 *           example: 15
 *         northEastDirMax:
 *           type: number
 *           example: 40
 *         northWestDirMin:
 *           type: number
 *           example: 10
 *         northWestDirMax:
 *           type: number
 *           example: 30
 *         southEastDirMin:
 *           type: number
 *           example: 20
 *         southEastDirMax:
 *           type: number
 *           example: 50
 *         southWestDirMin:
 *           type: number
 *           example: 15
 *         southWestDirMax:
 *           type: number
 *           example: 35
 *
 *     # Response schema (nested wind_speed object)
 *     Threshold:
 *       type: object
 *       properties:
 *         temperature:
 *           type: number
 *           example: 80
 *         humidity:
 *           type: number
 *           example: 40
 *         wind_speed:
 *           type: object
 *           properties:
 *             N:
 *               type: object
 *               properties:
 *                 min: { type: number, example: 20 }
 *                 max: { type: number, example: 50 }
 *             NE:
 *               type: object
 *               properties:
 *                 min: { type: number, example: 15 }
 *                 max: { type: number, example: 40 }
 *             E:
 *               type: object
 *               properties:
 *                 min: { type: number, example: 10 }
 *                 max: { type: number, example: 30 }
 *             SE:
 *               type: object
 *               properties:
 *                 min: { type: number, example: 20 }
 *                 max: { type: number, example: 50 }
 *             S:
 *               type: object
 *               properties:
 *                 min: { type: number, example: 25 }
 *                 max: { type: number, example: 55 }
 *             SW:
 *               type: object
 *               properties:
 *                 min: { type: number, example: 15 }
 *                 max: { type: number, example: 35 }
 *             W:
 *               type: object
 *               properties:
 *                 min: { type: number, example: 20 }
 *                 max: { type: number, example: 40 }
 *             NW:
 *               type: object
 *               properties:
 *                 min: { type: number, example: 10 }
 *                 max: { type: number, example: 30 }
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
