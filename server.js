const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const AMERIA_API_URL = process.env.AMERIA_API_URL;
const CLIENT_ID = process.env.CLIENT_ID;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const RETURN_URL = process.env.RETURN_URL;
const CANCEL_URL = process.env.CANCEL_URL;

app.post('/payment', async (req, res) => {
  const { name, email, amount } = req.body;

  // Генерация уникального OrderID
  const orderID = crypto.randomUUID();

  const paymentRequest = {
    ClientID: CLIENT_ID,
    Username: USERNAME,
    Password: PASSWORD,
    OrderID: orderID,
    Amount: amount,
    BackURL: RETURN_URL,
    Description: `Payment from ${email}`,
    CardHolderID: email,
    Opaque: email,
    PaymentTimeLimit: 60,
    Username: USERNAME,
    Password: PASSWORD
  };

  try {
    const response = await axios.post(`${AMERIA_API_URL}/vp/InitPayment`, paymentRequest, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('Ответ AmeriaBank:', response.data);

    if (response.data.ResponseCode === 1) {
      const paymentID = response.data.PaymentID;
      const redirectURL = `${AMERIA_API_URL}/vp/Payment/${paymentID}`;
      return res.json({ success: true, url: redirectURL });
    } else {
      return res.status(400).json({ success: false, message: response.data.ResponseMessage });
    }
  } catch (error) {
    console.error('Ошибка при создании платежа:', error.message);
    return res.status(500).json({ success: false, message: 'Ошибка при создании платежа' });
  }
});

// Обработка возврата с AmeriaBank
app.get('/payment-callback', (req, res) => {
  const { orderID, responseCode, paymentID, description } = req.query;

  console.log('🔁 Callback от AmeriaBank:', req.query);

  if (responseCode === '00') {
    return res.send(`<h2>✅ Оплата прошла успешно</h2><p>Payment ID: ${paymentID}</p>`);
  } else {
    return res.send(`<h2>❌ Оплата не удалась</h2><p>${description}</p>`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
