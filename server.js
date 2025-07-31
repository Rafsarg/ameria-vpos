const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Поддержка формата application/x-www-form-urlencoded и JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ✅ GET-запрос — просто чтобы проверить, жив ли сервер
app.get('/create-payment', (req, res) => {
  res.send('✅ Webhook is alive');
});

// 🔐 POST-запрос — создаёт платёж и делает редирект
app.post('/create-payment', async (req, res) => {
  console.log('📥 Incoming data:', req.body);

  // ✅ Если это тестовый запрос от Tilda — просто ответить OK
  if (req.body.test === 'test') {
    return res.sendStatus(200);
  }

  const { name, email, amount } = req.body;

  // 💵 Проверка на обязательную сумму 10 AMD в тестовом режиме
  if (amount !== '10') {
    return res.status(400).json({
      error: true,
      message: 'In test mode amount must be 10 AMD',
    });
  }

  const orderId = `ORDER-${Date.now()}`;

  try {
    const response = await axios.post('https://vpos.ameriabank.am/WebPOS/InitPayment', {
      ClientID: process.env.CLIENT_ID,
      Username: process.env.USERNAME,
      Password: process.env.PASSWORD,
      Amount: amount,
      OrderID: orderId,
      BackURL: process.env.RETURN_URL,
      Description: `Оплата билета от ${name}`,
    });

    const { ResponseCode, PaymentURL } = response.data;

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

// 🚀 Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
