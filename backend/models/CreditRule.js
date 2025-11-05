const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CreditRule = sequelize.define('CreditRule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    rules: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        base: 300,
        max: 850,
        weights: {
          payment_history: 0.4,
          utilization: 0.25,
          length: 0.1,
          recent_changes: 0.1,
          mix_and_stability: 0.15
        },
        penalties: {
          missed_payment_last_12m: 40
        }
      }
    }
  }, {
    tableName: 'credit_rules',
    timestamps: true
  });

  return CreditRule;
};