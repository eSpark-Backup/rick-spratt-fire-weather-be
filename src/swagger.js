import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swaggerSpec = swaggerJsDoc({
  definition: {
    openapi: "3.0.1",
    info: {
      title: "Fire Weather SMS Alert App",
      version: "1.0.1",
      description: "API documentation for the Fire Weather SMS Alert App",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [path.join(__dirname, "docs", "*.js")],
});

export { swaggerUi, swaggerSpec };
