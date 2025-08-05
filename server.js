const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (redirect.html, etc.)
app.use(express.static('public'));

// Маршрут для обработки формы
app.post('/payment', async (req, res) => {
  const { name, email, amount } = req.body;

  if (!name || !email || !amount) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const response = await axios.post(
      `${process.env.AMERIA_API_URL}/vpservlet`,
      {
        ClientID: process.env.AMERIA_CLIENT_ID,
        Username: process.env.AMERIA_USERNAME,
        Password: process.env.AMERIA_PASSWORD,
        Description: 'Оплата через сайт',
        OrderID: Date.now().toString(),
        Amount: Number(amount),
        BackURL: process.env.RETURN_URL,
        Opaque: '',
        Language: 'en',
        Currency: '051', // Armenian Dram
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const paymentURL = response.data.URL;
    const redirectPage = `https://ameria-vpos.fly.dev/redirect.html?redirect=${encodeURIComponent(paymentURL)}`;
    return res.redirect(redirectPage);
  } catch (error) {
    console.error('Ошибка при инициализации платежа:', error?.response?.data || error.message);
    return res.status(500).send('Ошибка при создании платежа');
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
