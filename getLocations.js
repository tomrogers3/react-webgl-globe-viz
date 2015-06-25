var request = require("superagent"),
  cheerio = require("cheerio"),
  url = "http://www.adp.com/worldwide.aspx",
  selector = "div#col-content tr span",
  fs = require("fs"),
  q = require("q"),
  MAGNITUDE = 0.1,
  BATCH_SIZE = 5,
  RATE_DELAY = 1000;

// Get geolocation
var geocoderProvider = 'google';
var httpAdapter = 'http';

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

var output = [];
var errors = [];

var countries, population = {}, A = Infinity, B = 0, a = 0.05, b = 0.2;

function GetMagnitude(x) {
  var entry;
  if (x.country && x.country.toLowerCase()) {
    var country = x.country.toLowerCase();
    entry = population[country];
    if (entry && entry.norm !== undefined && entry.norm !== null) {
      return entry.norm;
    } else {
      console.log("NO NORM FOR", JSON.stringify(x, null, 2));
      return a;
    }
  } else {
    console.log("UNKNOWN POPULATION FOR", JSON.stringify(x, null, 2));
    return a;
  }
}

function Go(countries, x) {
  var size = 0;
  if (x + BATCH_SIZE < countries.length) {
    size = x + BATCH_SIZE;
  } else {
    size = countries.length;
  }
  if (x < countries.length) {
    geocoder.batchGeocode(countries.slice(x, size), function(err, results) {
      var locations, l;
      //console.log(err, results);
      //console.log("RESULTS", results);
      console.log("BATCH", x / BATCH_SIZE);
      for (var r = 0; r < results.length; r++) {
        if (r.error) {
          errors.push(r.error);
        } else {
          locations = results[r].value;
          if (locations.length > 1) {
            var idx = 0;
            // tweak to get correct location for bahamas
            if (countries[r] === "bahamas") idx = 1;
            console.log("FOUND > 1 GEOCODE: ", countries[r], JSON.stringify(results[r].value.map(function (e) {
              return e.country;
            }), null, 2));
            l = locations[idx];
            output.push(l.latitude, l.longitude, GetMagnitude(l));
          } else {
            l = locations[0];
            output.push(l.latitude, l.longitude, GetMagnitude(l));
          }
        }
      }
      setTimeout(function() { Go(countries, x + BATCH_SIZE) }, RATE_DELAY);
    });
  } else {
    var series = [["ADP Countries", output]];
    console.log("SERIES", series);
    fs.writeFile (__dirname + "/src/www/assets/countries.json", JSON.stringify(series, null, 2));
  }

}

request
  .get(url)
  .end(function(err, res) {
    if (err) {
      console.log(err);
    } else {
      // Get ADP countries
      var $ = cheerio.load(res.text);
      countries = $(selector).map(function(i, c) {
        return { address: $(c).text().toLowerCase() };
      }).get();

      request.get("http://data.worldbank.org/indicator/SP.POP.TOTL")
        .end(function(err, res) {
          //console.log("GOT HERE!", res.text);
          var row, str, val, name;
          $ = cheerio.load(res.text);
          $("table.views-table tr").each(function(i, c) {
            row = $(c);
            str = row.find("td.views-field-wbapi-data-value-2013 span").text().replace(/\,/gi, "");
            val = str === "" ? 0 : parseInt(str);
            A = val < A && val != 0 ? val : A; // min
            B = val > B ? val : B; // max
            name = row.find("td.views-field-country-value a").text().toLowerCase();
            // cleanse data
            if (name.indexOf("bahamas") > -1) name = "the bahamas";
            if (name.indexOf("venezuela") > -1) name = "venezuela";
            if (name.indexOf("indonesia") > -1) name = "republic of indonesia";
            if (name.indexOf("hong kong") > -1) name = "hong kong";
            if (name.indexOf("macao") > -1) name = "macau";
            if (name.indexOf("macedonia") > -1) name = "macedonia (fyrom)";
            if (name.indexOf("egypt") > -1) name = "egypt";
            if (name.indexOf("slovak republic") > -1) name = "slovakia";
            if (name.indexOf("russian federation") > -1) name = "russia";
            if (name.indexOf("korea, dem. rep.") > -1) name = "south korea";

            population[name] = { abs: val };
          });
          population.jersey = { abs: 99500 };
          population.taiwan = { abs: 23370000 };
          population.guernsey = { abs: 65345 };
          Object.keys(population).forEach(function(k) {
            //console.log(k);
            //population[k].norm = a + ((population[k].abs - A) / (B - A)) * (b - a);
            population[k].norm = a + (Math.log(population[k].abs - A) / Math.log(B - A)) * (b - a);
            //population[k].norm = a + (Math.sqrt(population[k].abs - A) / Math.sqrt(B - A)) * (b - a);
          });
          //console.log("POPULATION", JSON.stringify(population, null, 2));

          Go(countries, 0);
        });

    }
  });

