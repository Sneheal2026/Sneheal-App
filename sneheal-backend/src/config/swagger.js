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
        ImageDocument: {
          type: 'object',
          required: ['base64'],
          properties: {
            mimeType: {
              type: 'string',
              enum: ['image/jpeg', 'image/png'],
              example: 'image/jpeg',
            },
            base64: {
              type: 'string',
              description: 'Base64 encoded image (max 1MB decoded)',
            },
          },
        },
        DoctorClinic: {
          type: 'object',
          required: ['addressLine', 'city', 'state', 'pincode'],
          properties: {
            addressLine: { type: 'string', example: '123 MG Road' },
            city: { type: 'string', example: 'Pune' },
            state: { type: 'string', example: 'Maharashtra' },
            pincode: { type: 'string', example: '411001', pattern: '^\\d{6}$' },
            landmark: { type: 'string', example: 'Near City Mall' },
          },
        },
        DeliveryDocuments: {
          type: 'object',
          required: ['aadhar', 'license'],
          properties: {
            aadhar: { $ref: '#/components/schemas/ImageDocument' },
            license: { $ref: '#/components/schemas/ImageDocument' },
          },
        },
        CompleteRegistrationRequest: {
          type: 'object',
          required: ['username', 'language', 'role'],
          properties: {
            username: { type: 'string', minLength: 2, example: 'Rahul Kumar' },
            language: {
              type: 'string',
              enum: ['ENGLISH', 'HINDI', 'MARATHI'],
              example: 'ENGLISH',
            },
            role: {
              type: 'string',
              enum: ['customer', 'doctor', 'delivery_agent'],
              example: 'customer',
            },
            clinic: {
              $ref: '#/components/schemas/DoctorClinic',
              description: 'Required only for doctor role',
            },
            documents: {
              $ref: '#/components/schemas/DeliveryDocuments',
              description: 'Required only for delivery_agent role',
            },
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
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
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
      '/api/auth/complete-registration': {
        post: {
          tags: ['Auth'],
          summary: 'Complete user registration after OTP verification',
          description:
            'Complete profile for new users. Role determines required fields: customer (basic only), doctor (+ clinic), delivery_agent (+ documents). Images must be < 1MB each.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompleteRegistrationRequest' },
                examples: {
                  customer: {
                    summary: 'Customer registration',
                    value: {
                      username: 'Rahul Kumar',
                      language: 'ENGLISH',
                      role: 'customer',
                    },
                  },
                  doctor: {
                    summary: 'Doctor registration',
                    value: {
                      username: 'Dr. Sharma',
                      language: 'HINDI',
                      role: 'doctor',
                      clinic: {
                        addressLine: '123 MG Road',
                        city: 'Pune',
                        state: 'Maharashtra',
                        pincode: '411001',
                        landmark: 'Near City Mall',
                      },
                    },
                  },
                  deliveryAgent: {
                    summary: 'Delivery agent registration',
                    value: {
                      username: 'Amit Singh',
                      language: 'MARATHI',
                      role: 'delivery_agent',
                      documents: {
                        aadhar: { mimeType: 'image/jpeg', base64: '<base64-string>' },
                        license: { mimeType: 'image/png', base64: '<base64-string>' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Profile completed, new tokens issued',
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
              description: 'Validation error (missing fields, invalid data, image too large)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            401: {
              description: 'Unauthorized (missing or invalid token)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            409: {
              description: 'Profile already completed or role conflict',
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
