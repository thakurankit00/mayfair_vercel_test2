const { Model } = require('objection');

class BaseModel extends Model {
  // Common timestamp handling
  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  // Common JSON schema validation
  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  // Enable UUID as primary key
  static get idColumn() {
    return 'id';
  }

  // Common query helpers
  static get modifiers() {
    return {
      // Order by creation date
      newest(query) {
        query.orderBy('created_at', 'desc');
      },

      // Order by updated date
      recentlyUpdated(query) {
        query.orderBy('updated_at', 'desc');
      }
    };
  }

  // Soft delete functionality
  async softDelete() {
    return await this.$query().patch({
      is_active: false,
      deleted_at: new Date().toISOString()
    });
  }

  // Restore soft deleted record
  async restore() {
    return await this.$query().patch({
      is_active: true,
      deleted_at: null
    });
  }
}

module.exports = BaseModel;
