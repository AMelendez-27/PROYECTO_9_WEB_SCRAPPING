const puppeteer = require('puppeteer');
const mongoose = require('mongoose');

const Data = mongoose.model('Data', new mongoose.Schema({
  title: String,
  price: String
}));

const connect = async () => {
  try {
    const URI = "mongodb+srv://admin:admin123@cluster0.0clinl8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(URI, {useNewUrlParser: true, useUnifiedTopology: true});
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

const scrapeCards = async () => {
  await connect();
};

scrapeCards()
