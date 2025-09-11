const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mayfair Hotel Management API',
      version: '1.0.0',
      description: 'Comprehensive API for hotel management system including rooms, restaurants, orders, and real-time kitchen communication',
      contact: {
        name: 'Hotel Management Team',
        email: 'tech@mayfairhotel.com'
      }
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            role: { 
              type: 'string', 
              enum: ['customer', 'receptionist', 'waiter', 'chef', 'bartender', 'manager', 'admin'] 
            },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Restaurant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            restaurant_type: { type: 'string', enum: ['restaurant', 'bar'] },
            location: { type: 'string', enum: ['ground_floor', 'first_floor', 'sky_roof'] },
            max_capacity: { type: 'integer' },
            has_kitchen: { type: 'boolean' },
            is_active: { type: 'boolean' }
          }
        },
        Table: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            restaurant_id: { type: 'string', format: 'uuid' },
            table_name: { type: 'string' },
            table_number: { type: 'string' },
            capacity: { type: 'integer' },
            location: { type: 'string', enum: ['indoor', 'outdoor', 'private_room', 'bar_counter'] },
            status: { type: 'string', enum: ['available', 'occupied', 'reserved', 'maintenance'] }
          }
        },
        MenuCategory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            restaurant_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['restaurant', 'bar'] },
            display_order: { type: 'integer' },
            is_active: { type: 'boolean' }
          }
        },
        MenuItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            category_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'decimal' },
            preparation_time: { type: 'integer' },
            is_vegetarian: { type: 'boolean' },
            is_vegan: { type: 'boolean' },
            is_available: { type: 'boolean' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            order_number: { type: 'string' },
            user_id: { type: 'string', format: 'uuid' },
            table_id: { type: 'string', format: 'uuid' },
            waiter_id: { type: 'string', format: 'uuid' },
            restaurant_id: { type: 'string', format: 'uuid' },
            target_kitchen_id: { type: 'string', format: 'uuid' },
            order_type: { type: 'string', enum: ['restaurant', 'bar', 'room_service'] },
            status: { type: 'string', enum: ['pending', 'preparing', 'ready', 'served', 'billed', 'cancelled'] },
            kitchen_status: { type: 'string', enum: ['pending', 'accepted', 'rejected', 'completed'] },
            total_amount: { type: 'number', format: 'decimal' },
            tax_amount: { type: 'number', format: 'decimal' },
            special_instructions: { type: 'string' },
            placed_at: { type: 'string', format: 'date-time' }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            order_id: { type: 'string', format: 'uuid' },
            menu_item_id: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            unit_price: { type: 'number', format: 'decimal' },
            total_price: { type: 'number', format: 'decimal' },
            special_instructions: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'preparing', 'ready', 'served'] }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Mayfair Hotel API Documentation'
  }));

  // Serve Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentation available at /api-docs');
};

module.exports = { setupSwagger, specs };
