const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/create-payment', (req, res) => {
  res.send('✅ Webhook is alive');
});

app.post('/create-payment', async (req, res) => {
  console.log('📥 Incoming data:', req.body);
  const { name, email, amount } = req.body;

  if (parseInt(amount) !== 10) {
    return res.status(400).json({
      error: true,
      message: 'In test mode amount must be 10 AMD',
    });
  }

  const orderId = `ORDER-${Date.now()}`;
  const payload = {
    ClientID: process.env.AMERIA_CLIENT_ID,
    Username: process.env.AMERIA_USERNAME,
    Password: process.env.AMERIA_PASSWORD,
    Amount: amount,
    OrderID: orderId,
    BackURL: process.env.RETURN_URL,
    Description: `Оплата билета от ${name}`,
  };

  try {
    const apiRes = await axios.post('https://servicestest.ameriabank.am/VPOS/api/VPOS/InitPayment', payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    const { ResponseCode, PaymentURL } = apiRes.data;

    if (ResponseCode !== '00' || !PaymentURL) {
      return res.status(500).json({
        error: true,
        message: 'Ошибка от Ameriabank: ' + JSON.stringify(apiRes.data),
      });
    }

    return res.json({
      success: true,
      redirectUrl: PaymentURL,
    });
  } catch (err) {
    console.error('❌ Ошибка сервера:', err.message);
    return res.status(500).json({
      error: true,
      message: 'Ошибка при инициализации платежа'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
