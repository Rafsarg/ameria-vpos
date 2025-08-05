const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Отдаём статические файлы из папки public (redirect.html и т.д.)
app.use(express.static('public'));

// Обработчик POST-запроса для создания платежа
app.post('/payment', async (req, res) => {
  const { name, email, amount } = req.body;

  if (!name || !email || !amount) {
    return res.status(400).json({ error: true, message: 'Missing required fields' });
  }

  try {
    const response = await axios.post(
      `${process.env.AMERIA_API_URL}/vpservlet`,
      {
        ClientID: process.env.AMERIA_CLIENT_ID,
        Username: process.env.AMERIA_USERNAME,
        Password: process.env.AMERIA_PASSWORD,
        Description: `Оплата через сайт от ${name}`,
        OrderID: Date.now().toString(),
        Amount: Number(amount),
        BackURL: process.env.RETURN_URL,
        Opaque: email || '',
        Language: 'en',
        Currency: '051', // AMD
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const paymentURL = response.data.URL;
    const redirectPage = `https://ameria-vpos.fly.dev/redirect.html?redirect=${encodeURIComponent(paymentURL)}`;

    // Возвращаем JSON с ссылкой для редиректа
    return res.json({ redirectUrl: redirectPage });
  } catch (error) {
    console.error('Ошибка при инициализации платежа:', error?.response?.data || error.message);
    return res.status(500).json({ error: true, message: 'Ошибка при создании платежа' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
