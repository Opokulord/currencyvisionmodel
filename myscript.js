 // Voice Recognition
 const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
 recognition.lang = 'en-US';
 recognition.continuous = true;
 recognition.interimResults = true;

 const voiceIcon = document.getElementById('voice-icon');
 const amountInput = document.getElementById('amount');
 const fromCurrencySelect = document.getElementById('from-currency');
 const toCurrencySelect = document.getElementById('to-currency');

 let isListening = false;

 voiceIcon.addEventListener('click', toggleVoiceRecognition);

 function toggleVoiceRecognition() {
     if (isListening) {
         recognition.stop();
         voiceIcon.textContent = '🎤';
     } else {
         recognition.start();
         voiceIcon.textContent = '🔴'; // Change icon to indicate active listening
     }
     isListening = !isListening;
 }

 recognition.onresult = (event) => {
     const transcript = Array.from(event.results)
         .map(result => result[0].transcript)
         .join('');

     const parsedInput = parseVoiceInput(transcript);
     
     if (parsedInput.amount !== null) {
         amountInput.value = parsedInput.amount;
     }
     
     if (parsedInput.fromCurrency !== null) {
         const fromOption = findCurrencyOption(fromCurrencySelect, parsedInput.fromCurrency);
         if (fromOption) fromCurrencySelect.value = fromOption.value;
     }

     if (parsedInput.toCurrency !== null) {
         const toOption = findCurrencyOption(toCurrencySelect, parsedInput.toCurrency);
         if (toOption) toCurrencySelect.value = toOption.value;
     }

     // If we have all necessary information, trigger conversion
     if (parsedInput.amount !== null && parsedInput.fromCurrency !== null && parsedInput.toCurrency !== null) {
         convertCurrency();
     }
 };

 function parseVoiceInput(input) {
     const words = input.toLowerCase().split(' ');
     let amount = null;
     let fromCurrency = null;
     let toCurrency = null;

     for (let i = 0; i < words.length; i++) {
         const word = words[i];
         
         // Check for amount
         const numberMatch = word.match(/^(\d+(\.\d+)?)$/);
         if (numberMatch && amount === null) {
             amount = numberMatch[1];
             continue;
         }

         // Check for currencies
         const currencyMatch = word.match(/^(dollar|euro|pound|yen|franc|yuan|cedi|naira|rand|rupee|real|ruble|peso|won|lira|krona|krone|złoty|baht|ringgit|shekel|dirham|riyal|dinar|usd|eur|gbp|jpy|chf|cny|ghs|ngn|zar|inr|brl|rub|mxn|krw|try|sek|nok|dkk|pln|thb|myr|ils|aed|sar|qar|kwd)s?$/);
         if (currencyMatch) {
             if (fromCurrency === null) {
                 fromCurrency = currencyMatch[1];
             } else if (toCurrency === null) {
                 toCurrency = currencyMatch[1];
             }
         }

         // Check for "to" keyword to identify target currency
         if (word === 'to' && i + 1 < words.length) {
             const nextWord = words[i + 1];
             const nextCurrencyMatch = nextWord.match(/^(dollar|euro|pound|yen|franc|yuan|cedi|naira|rand|rupee|real|ruble|peso|won|lira|krona|krone|złoty|baht|ringgit|shekel|dirham|riyal|dinar|usd|eur|gbp|jpy|chf|cny|ghs|ngn|zar|inr|brl|rub|mxn|krw|try|sek|nok|dkk|pln|thb|myr|ils|aed|sar|qar|kwd)s?$/);
             if (nextCurrencyMatch) {
                 toCurrency = nextCurrencyMatch[1];
                 i++; // Skip the next word as we've already processed it
             }
         }
     }

     return { amount, fromCurrency, toCurrency };
 }

 function findCurrencyOption(selectElement, currency) {
     return Array.from(selectElement.options).find(opt => 
         opt.text.toLowerCase().includes(currency.toLowerCase())
     );
 }

 function convertCurrency() {
     // Trigger the form submission to perform the conversion
     document.getElementById('conversion-form').dispatchEvent(new Event('submit'));
 }

 recognition.onend = () => {
     if (isListening) {
         recognition.start();
     }
 };

 // Currency Conversion with Real-time Exchange Rates
 const conversionForm = document.getElementById('conversion-form');
 const loadingDiv = document.getElementById('loading');
 const resultDiv = document.getElementById('conversion-result');
 const historyList = document.getElementById('history-list');

 // Updated Exchange Rate API
 const apiKey = '795611d3e89ad357e507b32e';

 conversionForm.addEventListener('submit', async (event) => {
     event.preventDefault();
     
     const amount = document.getElementById('amount').value;
     const fromCurrency = document.getElementById('from-currency').value;
     const toCurrency = document.getElementById('to-currency').value;
     
     loadingDiv.style.display = 'block';
     resultDiv.innerHTML = '';

     try {
         const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`);
         const data = await response.json();

         if (data.conversion_rates && data.conversion_rates[toCurrency]) {
             const rate = data.conversion_rates[toCurrency];
             const convertedAmount = (amount * rate).toFixed(2);
             resultDiv.innerHTML = `Conversion Result: ${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
             
             // Add to history
             const historyItem = document.createElement('li');
             historyItem.textContent = `${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency}`;
             historyList.prepend(historyItem);
             
             // Keep only the last 5 conversions
             if (historyList.children.length > 5) {
                 historyList.removeChild(historyList.lastChild);
             }

             // Save history to local storage
             saveHistory();
         } else {
             resultDiv.innerHTML = 'Error: Unable to fetch exchange rate';
         }
     } catch (error) {
         console.error('Error:', error);
         resultDiv.innerHTML = 'Error: Unable to perform conversion';
     } finally {
         loadingDiv.style.display = 'none';
     }
 });

 // Save conversion history to local storage
 function saveHistory() {
     const historyItems = Array.from(historyList.children).map(item => item.textContent);
     localStorage.setItem('conversionHistory', JSON.stringify(historyItems));
 }

 // Load conversion history from local storage
 function loadHistory() {
     const savedHistory = localStorage.getItem('conversionHistory');
     if (savedHistory) {
         const historyItems = JSON.parse(savedHistory);
         historyItems.forEach(item => {
             const historyItem = document.createElement('li');
             historyItem.textContent = item;
             historyList.appendChild(historyItem);
         });
     }
 }

 // Call loadHistory when the page loads
 loadHistory();

 // Camera Functionality
 const video = document.createElement('video');
 const canvas = document.createElement('canvas');
 const cameraIcon = document.getElementById('camera-icon');
 let stream;

 cameraIcon.addEventListener('click', () => {
     if (video.style.display === 'none' || video.style.display === '') {
         startCamera();
     } else {
         stopCamera();
     }
 });

 function startCamera() {
     navigator.mediaDevices.getUserMedia({ video: true })
         .then((s) => {
             stream = s;
             video.srcObject = stream;
             video.style.display = 'block';
             document.body.appendChild(video);
             video.play();
         })
         .catch((err) => {
             console.error("Error accessing camera: ", err);
             alert("Unable to access the camera. Please make sure you've granted the necessary permissions.");
         });
 }

 function stopCamera() {
     video.pause();
     video.style.display = 'none';
     stream.getTracks().forEach(track => track.stop());
 }

 // Navigation functionality
 document.querySelectorAll('.nav-link').forEach(link => {
     link.addEventListener('click', (e) => {
         e.preventDefault();
         const targetId = e.target.getAttribute('href').slice(1);
         document.querySelectorAll('.section').forEach(section => {
             section.classList.remove('active');
         });
         document.getElementById(targetId).classList.add('active');
     });
 });

 // Dark mode functionality
 const darkModeToggle = document.getElementById('dark-mode-toggle');
 darkModeToggle.addEventListener('click', () => {
     document.body.classList.toggle('dark-mode');
 });

 // Currency trend chart
 let chart;
 async function updateCurrencyTrendChart(fromCurrency, toCurrency) {
     const endDate = new Date().toISOString().split('T')[0];
     const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
     const response = await fetch(`https://api.exchangerate.host/timeseries?start_date=${startDate}&end_date=${endDate}&base=${fromCurrency}&symbols=${toCurrency}`);
     const data = await response.json();

     const dates = Object.keys(data.rates);
     const rates = dates.map(date => data.rates[date][toCurrency]);

     const ctx = document.getElementById('chart-container').getContext('2d');
     if (chart) {
         chart.destroy();
     }
     chart = new Chart(ctx, {
         type: 'line',
         data: {
             labels: dates,
             datasets: [{
                 label: `${fromCurrency} to ${toCurrency} Exchange Rate`,
                 data: rates,
                 borderColor: 'rgb(75, 192, 192)',
                 tension: 0.1
             }]
         },
         options: {
             responsive: true,
             scales: {
                 y: {
                     beginAtZero: false
                 }
             }
         }
     });
 }

 // Update chart when currencies change
 document.getElementById('from-currency').addEventListener('change', updateChartFromInputs);
 document.getElementById('to-currency').addEventListener('change', updateChartFromInputs);

 function updateChartFromInputs() {
     const fromCurrency = document.getElementById('from-currency').value;
     const toCurrency = document.getElementById('to-currency').value;
     updateCurrencyTrendChart(fromCurrency, toCurrency);
 }

 // Rate alert functionality
 let alertRate = null;
 function setRateAlert() {
     const fromCurrency = document.getElementById('from-currency').value;
     const toCurrency = document.getElementById('to-currency').value;
     alertRate = prompt(`Enter the desired exchange rate for 1 ${fromCurrency} to ${toCurrency}:`);
     if (alertRate) {
         alert(`Alert set for 1 ${fromCurrency} = ${alertRate} ${toCurrency}`);
         checkRateAlert();
     }
 }

 async function checkRateAlert() {
     if (!alertRate) return;
     const fromCurrency = document.getElementById('from-currency').value;
     const toCurrency = document.getElementById('to-currency').value;
     const response = await fetch(`https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`);
     const data = await response.json();
     const currentRate = data.rates[toCurrency];
     if (currentRate <= alertRate) {
         alert(`Alert: The exchange rate for 1 ${fromCurrency} has reached ${currentRate} ${toCurrency}`);
         alertRate = null;
     } else {
         setTimeout(checkRateAlert, 60000); // Check every minute
     }
 }

 // Add event listener for rate alert
 const setAlertButton = document.createElement('button');
 setAlertButton.textContent = 'Set Rate Alert';
 setAlertButton.addEventListener('click', setRateAlert);
 document.querySelector('.conversion-form').appendChild(setAlertButton);

 // Initialize chart with default currencies
 updateChartFromInputs();
 