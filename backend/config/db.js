const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected:', mongoose.connection.host + '/' + mongoose.connection.name);
  } catch (err) {
    console.error('\nFATAL: Could not connect to MongoDB at ' + process.env.MONGO_URI);
    console.error('Reason: ' + err.message);
    console.error('Start MongoDB (mongod) or fix MONGO_URI in backend/.env, then run again.\n');
    process.exit(1);
  }
};
