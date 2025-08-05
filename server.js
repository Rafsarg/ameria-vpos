// server.js
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/payment', async (req, res) => {
  const { name, email, amount } = req.body;

  const orderID = uuidv4(); // ✅ уникальный ID на каждый платёж

  const paymentData = {
    Username: process.env.AMERIA_USERNAME,
    Password: process.env.AMERIA_PASSWORD,
    ClientID: process.env.AMERIA_CLIENT_ID,
    OrderID: orderID,
    Amount: parseFloat(amount),
    BackURL: 'https://ameria-vpos.fly.dev/payment-callback', // сюда вернёт после оплаты
    Opaque: email,
    Description: 'Оплата через сайт',
    Currency: '051',
    Language: 'en',
  };

  try {
    const { data } = await axios.post(`${process.env.AMERIA_API_URL}/VPOS/InitPayment`, paymentData, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('Ответ AmeriaBank:', data);

    if (data.ResponseCode === 1 && data.PaymentID) {
      const redirectUrl = `${process.env.AMERIA_API_URL}/VPOS/Payments/${data.PaymentID}`;
      res.json({ redirectUrl });
    } else {
      res.status(400).json({ message: data.ResponseMessage || 'Ошибка при инициализации оплаты' });
    }
  } catch (err) {
    console.error('Ошибка при запросе к AmeriaBank:', err.message);
    res.status(500).json({ message: 'Ошибка при соединении с AmeriaBank' });
  }
});

app.get('/payment-callback', (req, res) => {
  console.log('✅ Callback от AmeriaBank:', req.query);
  res.send(`<h1>Спасибо за оплату</h1><p>Платёж ${req.query.paymentID || ''} завершён.</p>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
