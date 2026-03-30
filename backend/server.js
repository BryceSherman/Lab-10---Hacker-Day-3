import { Sequelize, DataTypes } from "sequelize";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const bearerToken = 'Bearer aaa.eyJzdWIiOiIxMjMifQ.bbb';
const token = bearerToken.slice(7);
const header = token.split('.')[0];
const payload = token.split('.')[1];
const signature = token.split('.')[2];
const DB_NAME = process.env.DB_NAME || 'app';
const DB_SCHEMA = process.env.DB_SCHEMA || 'public';
const useSsl = process.env.PGSSLMODE === 'require';

const app = express();

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: useSsl ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
      }
    : undefined,
  define: {
    schema: DB_SCHEMA,
  },
});

const Puppies = sequelize.define('puppies', {
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
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  schema: DB_SCHEMA,
  tableName: 'puppies',
  timestamps: false
});

const PORT = process.env.PORT || 5000;

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// GET All Puppies
app.get('/puppies', async (req, res) => {
  try {
    const puppies = await Puppies.findAll();
    res.json(puppies);
  } catch (err) {
    console.error('Error fetching puppies: ', err);
    res.status(500).json({ error: 'Failed to fetch puppies' });
  }
});

//GET Puppy by ID
app.get('/puppies/:id', async (req, res) => {
  const { id } = req.params;
  try {    const puppy = await Puppies.findByPk(id);
    if (puppy) {
      res.json(puppy);
    } else {
      res.status(404).json({ error: 'Puppy not found' });
    }
  } catch (err) {
    console.error('Error fetching puppy: ', err);
    res.status(500).json({ error: 'Failed to fetch puppy' });
  }
});

// POST Create a new Puppy
app.post('/puppies', async (req, res) => {
  const { name, breed, age, user_id } = req.body;
  try {    const newPuppy = await Puppies.create({ name, breed, age, user_id });
    res.status(201).json(newPuppy);
  } catch (err) {
    console.error('Error creating puppy: ', err);
    res.status(500).json({ error: 'Failed to create puppy' });
  }
});

// PUT Update a Puppy
app.put('/puppies/:id', async (req, res) => {
  const { id } = req.params;
  const { name, breed, age, user_id } = req.body;
  try {
    const puppy = await Puppies.findByPk(id);
    if (puppy) {
      puppy.name = name || puppy.name;
      puppy.breed = breed || puppy.breed;
      puppy.age = age || puppy.age;
      puppy.user_id = user_id || puppy.user_id;
      await puppy.save();
      res.json(puppy);
    } else {
      res.status(404).json({ error: 'Puppy not found' });
    }
  } catch (err) {
    console.error('Error updating puppy: ', err);
    res.status(500).json({ error: 'Failed to update puppy' });
  }
});

// DELETE a Puppy
app.delete('/puppies/:id', async (req, res) => {
  const { id } = req.params;
  try {    const puppy = await Puppies.findByPk(id);
    if (puppy) {
      await puppy.destroy();
      res.json({ message: 'Puppy deleted' });
    } else {
      res.status(404).json({ error: 'Puppy not found' });
    }
  } catch (err) {
    console.error('Error deleting puppy: ', err);
    res.status(500).json({ error: 'Failed to delete puppy' });
  }
});



const startServer = async () => {
  try {
    await sequelize.authenticate();
    if(token) {
      console.log('TOKEN HAS A VALUE');
    } else {
      console.log('Token has no value');
    }
    console.log('Bearer Token: ', bearerToken);
    console.log('Token: ', token);
    console.log('Header: ', header);
    console.log('Payload: ', payload);
    console.log('Signature: ', signature);
    console.log('Database connected...');

    await Puppies.sync({ alter: true });
    console.log(`Puppies model synced in schema "${DB_SCHEMA}".`);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error: ', err);
    process.exit(1);  // Exit with failure code
  }
};

startServer();