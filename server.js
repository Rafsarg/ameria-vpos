const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/create-payment', async (req, res) => {
  const { name, email, amount } = req.body;
  const orderID = Math.floor(Date.now() / 1000);

  const payload = {
    ClientID: process.env.AMERIA_CLIENT_ID,
    Username: process.env.AMERIA_USERNAME,
    Password: process.env.AMERIA_PASSWORD,
    OrderID: orderID,
    Amount: parseFloat(amount),
    Currency: "051",
    Description: `Ticket for ${name} (${email})`,
    BackURL: process.env.RETURN_URL,
    Timeout: 600
  };

  try {
    const response = await axios.post(
      'https://servicestest.ameriabank.am/VPOS/api/VPOS/InitPayment',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { PaymentID, ResponseCode, ResponseMessage } = response.data;

    if (ResponseCode == 1) {
      const payURL = `https://servicestest.ameriabank.am/VPOS/Payments/Pay?id=${PaymentID}&lang=en`;
      return res.redirect(payURL);
    } else {
      return res.status(400).json({ error: true, message: ResponseMessage });
    }
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
