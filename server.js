const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ✅ GET-запрос для проверки от Tilda
app.get('/create-payment', (req, res) => {
  res.send('✅ Webhook is alive');
});

// 🔐 POST: создаёт платёж и редиректит клиента
app.post('/create-payment', async (req, res) => {
  console.log('📥 Incoming data:', req.body);
  const { name, email, amount } = req.body;

  if (amount !== '10') {
    return res.status(400).json({
      error: true,
      message: 'In test mode amount must be 10 AMD',
    });
  }

  const orderId = `ORDER-${Date.now()}`;

  const response = await axios.post('https://vpos.ameriabank.am/WebPOS/InitPayment', {
    ClientID: process.env.CLIENT_ID,
    Username: process.env.USERNAME,
    Password: process.env.PASSWORD,
    Amount: amount,
    OrderID: orderId,
    BackURL: process.env.RETURN_URL,
    Description: `Ticket payment by ${name}`,
  });

  const { ResponseCode, PaymentID, PaymentURL } = response.data;

  if (ResponseCode !== '00') {
    return res.status(500).json({
      error: true,
      message: `Ameriabank error: ${JSON.stringify(response.data)}`,
    });
  }

  return res.redirect(PaymentURL);
});

// 🚀 Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
