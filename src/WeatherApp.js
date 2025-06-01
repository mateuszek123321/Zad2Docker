const http = require("http")    //modul do tworzeni serwera http
const https = require("https")  //do zapytan https
const url = require("url") //parsowanie adresu url
const querystring = require("querystring"); //do odczytania parametró zapytania get 



const hostname = "0.0.0.0";
const port = process.env.PORT || 80;
const autor = "Mateusz kłos";


const apiKey = process.env.OPENWEATHER_API_KEY || "2300671b775521d114a3ec74d708217d";

//lista predefiniowanych miast

const cities = {
    "Polska": ["Warszawa", "Kraków", "Gdańsk", "Wrocław", "Poznań"],
    "Niemcy": ["Berlin", "Monachium", "Hamburg", "Frankfurt", "Kolonia"],
    "Francja": ["Paryż", "Marsylia", "Lyon", "Tuluza", "Nicea"]
};

//funkcja do pobrania pogody
//tworzy url do zapytania 
//wysyla ządanie https i przetwarza json
//zwraca promise który zwraca dane pogodwe lub błąd
function pobraniePogody(city, country){
    return new Promise((resolve, reject) => {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&units=metric&appid=${apiKey}`;
    
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
              data += chunk;
            });
            
            res.on('end', () => {
              try {
                const weatherData = JSON.parse(data);
                resolve(weatherData);
              } catch (e) {
                reject(e);
              }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

//podstawowy formularz
function formularzHtml(){
    let countriesOptions = '';
    Object.keys(cities).forEach(country => {
        countriesOptions += `<option value="${country}">${country}</option>`;
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Aplikacja Pogodowa</title>
      <style>
        body { font-family: Arial; margin: 20px; }
        select, button { margin: 5px 0; padding: 5px; }
      </style>
    </head>
    <body>
      <h1>Aplikacja Pogodowa</h1>
      <form method="get" action="/weather">
        <div>
          <label for="country">Wybierz kraj:</label>
          <select id="country" name="country">
            <option value="">-- Wybierz kraj --</option>
            ${countriesOptions}
          </select>
        </div>
        <div>
          <label for="city">Wybierz miasto:</label>
          <select id="city" name="city">
            <option value="">-- Najpierw wybierz kraj --</option>
          </select>
        </div>
        <button type="submit">Sprawdź pogodę</button>
      </form>
      
      <script>
        const countrySelect = document.getElementById('country');
        const citySelect = document.getElementById('city');
        const citiesData = ${JSON.stringify(cities)};
        
        countrySelect.addEventListener('change', function() {
          const country = this.value;
          citySelect.innerHTML = '<option value="">-- Wybierz miasto --</option>';
          
          if (country) {
            const countryCities = citiesData[country] || [];
            countryCities.forEach(city => {
              const option = document.createElement('option');
              option.value = city;
              option.textContent = city;
              citySelect.appendChild(option);
            });
          }
        });
      </script>
    </body>
    </html>
    `;
}

//wyswietlenie odpowiedzi
function odpowiedzHtml(weatherData, city, country){
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Wyniki Pogody</title>
      <style>
        body { font-family: Arial; margin: 20px; }
        .weather-info { margin: 20px 0; }
        a { display: inline-block; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>Pogoda: ${city}, ${country}</h1>
      <div class="weather-info">
        <p>Temperatura: ${weatherData.main.temp}°C</p>
        <p>Odczuwalna temperatura: ${weatherData.main.feels_like}°C</p>
        <p>Wilgotność: ${weatherData.main.humidity}%</p>
        <p>Ciśnienie: ${weatherData.main.pressure} hPa</p>
        <p>Wiatr: ${weatherData.wind.speed} m/s</p>
        <p>Opis: ${weatherData.weather[0].description}</p>
      </div>
      <a href="/">Powrót do wyszukiwania</a>
    </body>
    </html>
  `;
}

//serwer
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url)
    const pathname = parsedUrl.pathname;
    const query = querystring.parse(parsedUrl.query || '');

    try {
        if(pathname === '/' || pathname ===''){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(formularzHtml());
            return;
        }
        //oblsuga zapytan
        if (pathname === '/weather') {
            const city = query.city;
            const country = query.country;
            
            if (!city || !country) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end('<h1>Brak miasta lub kraju!</h1><a href="/">Powrót</a>');
              return;
            }

            try {
                const weatherData = await pobraniePogody(city, country);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end(odpowiedzHtml(weatherData, city, country));
              } catch (error) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end('<h1>Błąd danych</h1><a href="/">Powrót</a>');
              }
              return;
        }

    // Obsługa 404
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>Nie znaleziono strony</h1><a href="/">Powrót</a>');
    
  } catch (error) {
    // Obsługa błędów serwera
    console.error('Błąd serwera:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1>Błąd wewnętrzny serwera</h1><a href="/">Powrót</a>');
  }

});


server.listen(port, hostname, () => {
    const Time = new Date().toISOString();
    console.log(`[${Time}] Aplikacja uruchomiona, autor ${autor}, nasłuchuje na porcie:  ${port}`)
});