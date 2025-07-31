const express = require('express');
const axios = require('axios');
const qs = require('qs');
const app = express();
const port = process.env.PORT || 8080;

// 👉 Нужно, чтобы принимать формы от Tilda
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/create-payment', async (req, res) => {
  try {
    console.log('📥 Incoming data:', req.body); // <--- ЭТО ДОБАВЛЯЕМ

    const { name, email, amount } = req.body;

    if (amount !== '10') {
      return res.status(400).json({
        error: true,
        message: 'In test mode amount must be 10 AMD',
      });
    }

    const clientId = process.env.AMERIA_CLIENT_ID || 'YourClientID';
    const returnUrl = process.env.RETURN_URL || 'https://yourdomain.com/thanks';

    const paymentData = {
      ClientID: clientId,
      Amount: amount,
      Username: name || 'Test User',
      Email: email || '',
      OrderID: 'ORDER-' + Date.now(),
      BackURL: returnUrl,
    };

    // Запрос к Ameriabank VPOS InitPayment
    const response = await axios.post(
      'https://testpayments.ameriabank.am/VPOS/api/InitPayment',
      paymentData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { ResponseCode, Description, PaymentID, FormUrl } = response.data;

    if (ResponseCode === '00' && FormUrl) {
      return res.redirect(FormUrl); // ✅ Перенаправляем клиента на Ameriabank
    } else {
      return res.status(400).json({
        error: true,
        message: Description || 'Payment initiation failed',
      });
    }
  } catch (error) {
    console.error('Payment error:', error?.response?.data || error.message);
    return res.status(500).json({
      error: true,
      message: 'Server error during payment creation',
    });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Ameria VPOS server is running.');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
