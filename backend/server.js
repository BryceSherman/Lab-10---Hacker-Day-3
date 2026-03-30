import { Sequelize, DataTypes } from "sequelize";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const DB_NAME = process.env.DB_NAME || "app";
const DB_SCHEMA = process.env.DB_SCHEMA || "public";
const useSsl = process.env.PGSSLMODE === "require";

const app = express();

app.use(cors());
app.use(express.json());

/*
JWT Middleware
Extracts Bearer token and stores decoded payload in req.user
*/
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.decode(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    console.log("Decoded token:", decoded);

    req.user = decoded;
    req.user.userId =
      decoded.sub ||
      decoded.userid ||
      decoded.username ||
      decoded.email;

    if (!req.user.userId) {
      return res.status(400).json({ error: "No usable user identifier found in token" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token decode failed" });
  }
};

/*
Database connection
*/
const sequelize = new Sequelize(
  DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : undefined,
    define: {
      schema: DB_SCHEMA
    }
  }
);

/*
Model definition
*/
const Puppies = sequelize.define(
  "puppies",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    breed: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    schema: DB_SCHEMA,
    tableName: "puppies",
    timestamps: false
  }
);

const PORT = process.env.PORT || 5000;

/*
Routes
*/

// GET all puppies (only current user's puppies)
app.get("/puppies", verifyToken, async (req, res) => {
  try {
    const puppies = await Puppies.findAll({
      where: { user_id: req.user.userId }
    });

    res.json(puppies);
  } catch (err) {
    console.error("Error fetching puppies:", err);
    res.status(500).json({ error: "Failed to fetch puppies" });
  }
});

// GET puppy by id (only if owned)
app.get("/puppies/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const puppy = await Puppies.findByPk(id);

    if (!puppy) {
      return res.status(404).json({ error: "Puppy not found" });
    }

    if (puppy.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(puppy);
  } catch (err) {
    console.error("Error fetching puppy:", err);
    res.status(500).json({ error: "Failed to fetch puppy" });
  }
});

// POST create puppy (assign logged-in user automatically)
app.post("/puppies", verifyToken, async (req, res) => {
  const { name, breed, age } = req.body;

  try {
    const newPuppy = await Puppies.create({
      name,
      breed,
      age,
      user_id: req.user.userId
    });

    res.status(201).json(newPuppy);
  } catch (err) {
    console.error("Error creating puppy:", err);
    res.status(500).json({ error: "Failed to create puppy" });
  }
});

// PUT update puppy (only if owned)
app.put("/puppies/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, breed, age } = req.body;

  try {
    const puppy = await Puppies.findByPk(id);

    if (!puppy) {
      return res.status(404).json({ error: "Puppy not found" });
    }

    if (puppy.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    puppy.name = name ?? puppy.name;
    puppy.breed = breed ?? puppy.breed;
    puppy.age = age ?? puppy.age;

    await puppy.save();

    res.json(puppy);
  } catch (err) {
    console.error("Error updating puppy:", err);
    res.status(500).json({ error: "Failed to update puppy" });
  }
});

// DELETE puppy (only if owned)
app.delete("/puppies/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const puppy = await Puppies.findByPk(id);

    if (!puppy) {
      return res.status(404).json({ error: "Puppy not found" });
    }

    if (puppy.user_id !== req.user.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await puppy.destroy();

    res.json({ message: "Puppy deleted" });
  } catch (err) {
    console.error("Error deleting puppy:", err);
    res.status(500).json({ error: "Failed to delete puppy" });
  }
});

/*
Start server
*/
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected...");

    await Puppies.sync({ alter: true });
    console.log(`Puppies model synced in schema "${DB_SCHEMA}".`);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

startServer();