const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    currentNetWorth: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    currentCreditScore: {
      type: DataTypes.INTEGER,
      defaultValue: 300
    },
    monthsSimulated: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'profiles',
    timestamps: true
  });

  return Profile;
};