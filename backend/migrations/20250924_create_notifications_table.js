/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // User who should receive the notification
    table.uuid('user_id').notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Notification type (for filtering and styling)
    table.string('type', 50).notNullable(); // 'new-order', 'order-update', 'order-ready', etc.
    
    // Notification content
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    
    // Additional data (JSON) for navigation and context
    table.jsonb('data').nullable();
    
    // Status and priority
    table.boolean('read').defaultTo(false).notNullable();
    table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium').notNullable();
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('read_at').nullable();
    table.timestamp('expires_at').nullable(); // Optional expiration for temporary notifications
    
    // Indexes for performance
    table.index(['user_id', 'read', 'created_at'], 'idx_notifications_user_read_created');
    table.index(['user_id', 'type'], 'idx_notifications_user_type');
    table.index(['created_at'], 'idx_notifications_created');
    table.index(['expires_at'], 'idx_notifications_expires');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notifications');
};
