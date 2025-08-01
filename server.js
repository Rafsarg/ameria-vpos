const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ✅ GET-проверка для Tilda Webhook
app.get('/create-payment', (req, res) => {
  res.send('✅ Webhook is alive');
});

// 🔐 POST — создание платежа
app.post('/create-payment', async (req, res) => {
  try {
    console.log('📥 Incoming data:', req.body);

    const { name, email, amount } = req.body;

    if (parseInt(amount) !== 10) {
      return res.status(400).json({
        error: true,
        message: 'In test mode amount must be 10 AMD',
      });
    }

    const orderId = `ORDER-${Date.now()}`;

    const response = await axios.post('https://vpos.ameriabank.am/WebPOS/InitPayment', {
      ClientID: process.env.AMERIA_CLIENT_ID,
      Username: process.env.AMERIA_USERNAME,
      Password: process.env.AMERIA_PASSWORD,
      Amount: amount,
      OrderID: orderId,
      BackURL: process.env.RETURN_URL,
      Description: `Ticket from ${name}`,
    });

    const { ResponseCode, PaymentURL } = response.data;

    if (ResponseCode !== '00') {
      return res.status(500).json({
        error: true,
        message: 'Ошибка от Ameriabank: ' + JSON.stringify(response.data),
      });
    }

    // ✅ HTML-редирект через форму (обход Tilda)
    return res.send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Redirecting...</title>
        </head>
        <body>
          <form id="payform" method="POST" action="${PaymentURL}">
            <noscript><input type="submit" value="Continue"></noscript>
          </form>
          <script>document.getElementById("payform").submit();</script>
        </body>
      </html>
    `);
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
  console.log(`✅ Server running on port ${PORT}`);
});
