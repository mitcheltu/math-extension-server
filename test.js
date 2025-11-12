import https from 'https';

const API_KEY = "sk-or-v1-0f99c1c61255936965112eae5268da07fda80ac53b45ba7978e94571cd99f222YOUR_API_KEY"; // Replace with your actual key

const data = JSON.stringify({
  model: "deepseek-chat",
  messages: [{ role: "user", content: "Hi" }]
});

const options = {
  hostname: 'api.deepseek.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Length': data.length
  },
  rejectUnauthorized: false // Bypass SSL error
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e));
req.write(data);
req.end();