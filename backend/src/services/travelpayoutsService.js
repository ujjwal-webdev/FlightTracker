const axios = require('axios');

const travelAPI = axios.create({
  baseURL: 'https://api.travelpayouts.com/v2',
  params: {
    token: process.env.TRAVELPAYOUTS_API_TOKEN
  }
});

function currentMonthStartISO() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}-01`;
}

const fetchMonthlyPrices = async (origin, destination, month = currentMonthStartISO(), currency = 'USD') => {
    try {
      const res = await travelAPI.get('/prices/month-matrix', {
        params: {
          origin,
          destination,
          month,
          currency,
          one_way: true
        }
      });
      
      return res.data?.data || [];
    } catch (err) {
      console.error('Travelpayouts error:', err.message);
      return [];
    }
};

module.exports = { fetchMonthlyPrices };
