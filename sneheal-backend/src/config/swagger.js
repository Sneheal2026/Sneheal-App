const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sneheal API',
      version: '1.0.0',
      description:
        'Sneheal backend API documentation. In development mode, OTP codes are printed in the server terminal after calling send-otp.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Local development',
      },
    ],
    components: {
      schemas: {
        SendOtpRequest: {
          type: 'object',
          required: ['phone'],
          properties: {
            phone: {
              type: 'string',
              example: '9876543210',
              description: '10-digit Indian mobile number',
            },
          },
        },
        VerifyOtpRequest: {
          type: 'object',
          required: ['phone', 'otp'],
          properties: {
            phone: {
              type: 'string',
              example: '9876543210',
            },
            otp: {
              type: 'string',
              example: '123456',
              description: '6-digit OTP (check server terminal in dev mode)',
            },
          },
        },
        AuthUser: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            phone: { type: 'string', example: '+919876543210' },
            username: { type: 'string', nullable: true, example: null },
            language: { type: 'string', nullable: true, example: null },
            role: {
              type: 'string',
              nullable: true,
              enum: ['customer', 'doctor', 'delivery_agent', null],
            },
            profileCompleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SendOtpData: {
          type: 'object',
          properties: {
            resendAfterSeconds: { type: 'integer', example: 30 },
            devOtp: {
              type: 'string',
              example: '123456',
              description: 'Only returned in development (NODE_ENV !== production)',
            },
          },
        },
        VerifyOtpData: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { $ref: '#/components/schemas/AuthUser' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            200: {
              description: 'API is running',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
          },
        },
      },
      '/api/auth/send-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Send OTP to phone number',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SendOtpRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'OTP sent successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/SendOtpData' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Invalid phone number',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            429: {
              description: 'Resend cooldown or rate limit',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/auth/verify-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Verify OTP and get auth tokens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerifyOtpRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'OTP verified, tokens issued',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/VerifyOtpData' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            401: {
              description: 'Invalid or expired OTP',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
