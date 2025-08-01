const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Разрешаем запросы от Tilda
app.use(express.urlencoded({ extended: true })); // Для данных от Tilda
app.use(express.json()); // На случай JSON

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ✅ Проверка работы
app.get('/create-payment', (req, res) => {
  res.send('✅ Сервер работает');
});

// 🔄 Основной обработчик
app.post('/create-payment', async (req, res) => {
  try {
    console.log('📩 Данные от Tilda:', req.body);

    // Проверка данных
    const { name, email, amount } = req.body;
    if (!name || !email || !amount) {
      throw new Error('Не хватает name, email или amount');
    }

    // Фиксированная сумма для теста
    if (Number(amount) !== 10) {
      return res.status(400).json({ error: 'В тестовом режиме сумма должна быть 10 AMD' });
    }

    // Запрос в Ameriabank
    const response = await axios.post(
      'https://vpos.ameriabank.am/WebPOS/InitPayment',
      {
        ClientID: process.env.AMERIA_CLIENT_ID,
        Username: process.env.AMERIA_USERNAME,
        Password: process.env.AMERIA_PASSWORD,
        Amount: amount,
        OrderID: `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        BackURL: process.env.RETURN_URL,
        Description: `Платеж от ${name} (${email})`,
      },
      { timeout: 10000 } // Таймаут 10 секунд
    );

    console.log('🔑 Ответ от Ameriabank:', response.data);

    // Проверка ответа банка
    if (response.data.ResponseCode !== '00' || !response.data.PaymentURL) {
      throw new Error('Ошибка Ameriabank: ' + JSON.stringify(response.data));
    }

    // Успешный ответ
    res.json({
      success: true,
      paymentUrl: response.data.PaymentURL
    });

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    res.status(500).json({
      error: true,
      message: error.message || 'Ошибка сервера'
    });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
