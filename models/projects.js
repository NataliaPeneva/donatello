"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Projects extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Tag, Donations }) {
      // define association here
      // foreignKey is from this table and belongs to User
      this.belongsTo(User, { foreignKey: "userId", as: "user" });
      this.belongsToMany(Tag, {
        through: "ProjectsTags",
        foreignKey: "projectId",
        otherKey: "tagId",
      });
      this.hasMany(Donations, { foreignKey: "projectId", as: "donations" });
    }

    toJSON() {
      return { ...this.get() };
    }
  }
  Projects.init(
    {
      // uuid: {
      //   type: DataTypes.UUID,
      //   defaultValue: DataTypes.UUIDV4,
      // },
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      projectName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Project must have a name." },
          notEmpty: { msg: "Project name must not be empty." },
        },
      },
      projectDescription: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Project must have a description." },
          notEmpty: { msg: "Project description must not be empty." },
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: "projects",
      modelName: "Projects",
    }
  );
  return Projects;
};
