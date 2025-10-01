/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('room_bookings', function(table) {
    // Add guest information fields if they don't exist
    table.string('guest_first_name').nullable();
    table.string('guest_last_name').nullable();
    table.string('guest_phone').nullable();
    table.string('guest_email').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('room_bookings', function(table) {
    table.dropColumn('guest_first_name');
    table.dropColumn('guest_last_name');
    table.dropColumn('guest_phone');
    table.dropColumn('guest_email');
  });
};
