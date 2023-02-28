const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const CronJob = require('cron').CronJob;
require('dotenv').config();

const client = new Client({ authStrategy: new LocalAuth() });

const API_DOLAR = 'https://www.dolarsi.com/api/api.php?type=valoresprincipales';
const API_WEATHER_KEY = process.env.API_WEATHER_KEY;
const CITY = 'Buenos Aires,ar';
const API_WEATHER = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_WEATHER_KEY}&lang=es`;
const chatId = process.env.chatId;

const getDolarPrices = async () => {
	const response = await fetch(API_DOLAR);
	const data = await response.json();
	const dolarBlue = data.find((price) => price.casa.nombre === 'Dolar Blue');

	return {
		name: dolarBlue.casa.nombre,
		buy: dolarBlue.casa.compra,
		sell: dolarBlue.casa.venta,
		variation: dolarBlue.casa.variacion,
	};
};

const getWeather = async () => {
	const response = await fetch(API_WEATHER);
	const data = await response.json();

	return {
		temp: parseInt(data.main.temp),
		temp_max: parseInt(data.main.temp_max),
		temp_min: parseInt(data.main.temp_min),
		weather: data.weather[0].description,
		visibility: data.visibility,
	};
};

const main = async () => {
	const dolarPrices = await getDolarPrices();
	const weatherInfo = await getWeather();
	const chat = await client.getChatById(chatId);
	const message = `
🌤️ ¡Buenos días! ☀️

🌡️ Reporte del clima en Buenos Aires para hoy:
* Temperatura actual: ${weatherInfo.temp}°C
* Máxima: ${weatherInfo.temp_max}°C
* Mínima: ${weatherInfo.temp_min}°C
* Clima: ${weatherInfo.weather}
* Visibilidad: ${weatherInfo.visibility / 1000} km

💰 ${dolarPrices.name} 💰
* Compra: ${dolarPrices.buy} ARS
* Venta: ${dolarPrices.sell} ARS
* Variación: ${dolarPrices.variation}%

📅 Fecha: ${new Date().toLocaleDateString('es-AR', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})}

Que tengas un excelente día! 🌞🌻🌼
`;
	chat.sendMessage(message);
};

client.on('qr', (qr) => {
	qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
	console.log('El cliente esta listo!');
	const job = new CronJob(
		'30 6 * * *',
		main,
		null,
		true,
		'America/Argentina/Buenos_Aires'
	);

	job.start();
});

client.initialize();
