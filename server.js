const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.urlencoded({ extended: true })); // для form-urlencoded
app.use(express.json());

// Счётчик OrderID (2350301–2350400)
let testOrderId = 2350301;

app.get('/', (req, res) => {
  res.send('✅ Server is running. Use POST /create-payment.');
});

app.post('/create-payment', async (req, res) => {
  console.log('📥 Получены данные:', req.body);
  const { name, email, amount } = req.body;

  if (parseInt(amount) !== 10) {
    return res.status(400).send('В тестовом режиме сумма должна быть 10 AMD');
  }

  const orderId = testOrderId++;
  if (testOrderId > 2350400) testOrderId = 2350301;

  const payload = {
    ClientID: process.env.AMERIA_CLIENT_ID,
    Username: process.env.AMERIA_USERNAME,
    Password: process.env.AMERIA_PASSWORD,
    Amount: parseFloat(amount),
    OrderID: orderId,
    BackURL: process.env.RETURN_URL, // URL обратного вызова после оплаты
    Description: `Оплата билета от ${name}`,
    Currency: '051',
    Timeout: 1200,
    Opaque: email || '',
  };

  try {
    const apiRes = await axios.post(
      'https://servicestest.ameriabank.am/VPOS/api/VPOS/InitPayment',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { PaymentID, ResponseCode, ResponseMessage } = apiRes.data;

    if (ResponseCode !== 1) {
      console.error('❌ Ошибка AmeriaBank:', ResponseMessage);
      return res.status(500).send(`Ошибка AmeriaBank: ${ResponseMessage} (Код: ${ResponseCode})`);
    }

    const paymentUrl = `https://servicestest.ameriabank.am/VPOS/Payments/Pay?id=${PaymentID}&lang=en`;

    // Сразу редиректим клиента на оплату
    return res.redirect(paymentUrl);
  } catch (err) {
    console.error('❌ Ошибка сервера:', err.message);
    return res.status(500).send(`Ошибка сервера: ${err.message}`);
  }
});

app.get('/payment-callback', async (req, res) => {
  const { orderID, responseCode, paymentID, opaque } = req.query;
  console.log('📥 Callback:', req.query);

  const TILDA_SUCCESS_URL = process.env.TILDA_SUCCESS_URL || 'https://your-tilda-site.com/thank-you';
  const TILDA_FAIL_URL = process.env.TILDA_FAIL_URL || 'https://your-tilda-site.com/error';

  if (responseCode !== '00') {
    return res.redirect(`${TILDA_FAIL_URL}?error=Платеж не выполнен&orderID=${orderID}`);
  }

  try {
    const paymentDetailsRes = await axios.post(
      'https://servicestest.ameriabank.am/VPOS/api/VPOS/GetPaymentDetails',
      {
        PaymentID: paymentID,
        Username: process.env.AMERIA_USERNAME,
        Password: process.env.AMERIA_PASSWORD,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { ResponseCode, PaymentState, Amount, CardNumber, ClientEmail } = paymentDetailsRes.data;

    if (ResponseCode !== '00') {
      return res.redirect(
        `${TILDA_FAIL_URL}?error=Ошибка проверки платежа&orderID=${orderID}`
      );
    }

    const successUrl = `${TILDA_SUCCESS_URL}?orderID=${orderID}&status=${PaymentState}&amount=${Amount}&card=${CardNumber}&email=${ClientEmail || opaque}`;
    res.redirect(successUrl);
  } catch (err) {
    console.error('❌ Ошибка п
