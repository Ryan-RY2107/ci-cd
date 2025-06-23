const axios = require('axios');

async function fetchData() {
  try {
    const res = await axios.get('http://backend:3001/api');
    console.log(res.data);
  } catch (error) {
    console.error('Error fetching data from backend:', error.message);
  }
}

fetchData();
