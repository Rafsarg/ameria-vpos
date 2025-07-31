const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ✅ GET для проверки Tilda
app.get('/create-payment', (req, res) => {
  res.send('✅ Webhook is alive');
});

// 🔐 POST: создаёт платёж и редиректит пользователя
app.post('/create-payment', async (req, res) => {
  try {
    console.log('📥 Incoming data:', req.body);

    const { name, email, amount } = req.body;

    if (amount !== '10') {
      return res.status(400).json({
        error: true,
        message: 'In test mode amount must be 10 AMD',
      });
    }

    // Уникальный ID транзакции (можно заменить на uuid или timestamp)
    const orderId = `ORDER-${Date.now()}`;

    // Обращение к API Ameriabank InitPayment
    const response = await axios.post('https://vpos.ameriabank.am/WebPOS/InitPayment', {
      ClientID: process.env.CLIENT_ID,
      Username: process.env.USERNAME,
      Password: process.env.PASSWORD,
      Amount: amount,
      OrderID: orderId,
      BackURL: process.env.RETURN_URL,
      Description: `Оплата билета от ${name}`,
    });

    const { ResponseCode, PaymentID, PaymentURL } = response.data;

    if (ResponseCode !== '00') {
      return res.status(500).json({
        error: true,
        message: 'Ошибка от Ameriabank: ' + JSON.stringify(response.data),
      });
    }

    // ✅ Успех — редиректим пользователя на страницу оплаты
    return res.redirect(PaymentURL);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    return res.status(500).json({
      error: true,
      message: 'Ошибка при инициализации платежа',
    });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
