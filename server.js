const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 🔍 Проверка доступности хука
app.get('/create-payment', (req, res) => {
  res.send('✅ Webhook is alive');
});

// 🔐 Основной платёж
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

    const orderId = `ORDER-${Date.now()}`;

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
      return res.status(500).send(`<h1>❌ Ошибка от Ameriabank</h1><pre>${JSON.stringify(response.data)}</pre>`);
    }

    // ✅ HTML-редирект вместо res.redirect
    return res.send(`
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Перенаправление на оплату</title>
          <script>
            window.location.href = "${PaymentURL}";
          </script>
        </head>
        <body>
          <p>⏳ Пожалуйста, подождите. Перенаправляем на Ameriabank...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    return res.status(500).send(`<h1>❌ Ошибка при инициализации платежа</h1><pre>${error.message}</pre>`);
  }
});

// 🟢 Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
