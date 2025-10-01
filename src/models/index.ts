import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { User, BirthdayNotification } from '../types';

// User model definition
interface UserCreationAttributes extends Optional<User, 'id' | 'createdAt' | 'updatedAt'> {}

export class UserModel extends Model<User, UserCreationAttributes> implements User {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public birthday!: Date;
  public location!: string;
  public timezone!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public notifications?: BirthdayNotificationModel[];
}

// BirthdayNotification model definition
interface BirthdayNotificationCreationAttributes extends Optional<BirthdayNotification, 'id' | 'createdAt' | 'updatedAt'> {}

export class BirthdayNotificationModel extends Model<BirthdayNotification, BirthdayNotificationCreationAttributes> implements BirthdayNotification {
  public id!: string;
  public userId!: string;
  public scheduledDate!: Date;
  public sentAt?: Date;
  public status!: 'pending' | 'sent' | 'failed' | 'retrying';
  public retryCount!: number;
  public errorMessage?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public user?: UserModel;
}

export const initializeModels = (sequelize: Sequelize) => {
  // Define User model
  UserModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      birthday: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true,
        },
      },
      location: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 200],
        },
      },
      timezone: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 50],
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      indexes: [
        {
          fields: ['birthday'],
        },
        {
          fields: ['timezone'],
        },
        {
          fields: ['firstName', 'lastName'],
        },
      ],
    }
  );

  // Define BirthdayNotification model
  BirthdayNotificationModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: UserModel,
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      scheduledDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
        },
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed', 'retrying'),
        allowNull: false,
        defaultValue: 'pending',
      },
      retryCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'BirthdayNotification',
      tableName: 'birthday_notifications',
      timestamps: true,
      indexes: [
        {
          fields: ['scheduledDate'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['userId', 'scheduledDate'],
          unique: true,
        },
        {
          fields: ['status', 'scheduledDate'],
        },
      ],
    }
  );

  // Define associations
  UserModel.hasMany(BirthdayNotificationModel, {
    foreignKey: 'userId',
    as: 'notifications',
  });

  BirthdayNotificationModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'user',
  });

  return {
    UserModel,
    BirthdayNotificationModel,
  };
};
