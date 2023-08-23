import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import https from "https";
import mongoose from "mongoose";
import axios from "axios";
import session from "express-session";
import passport from "passport";
import passportLocal from "passport-local";
import passportLocalMongoose from "passport-local-mongoose";

const app = express();
const http = axios.create();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

//variables

let icon,
  description,
  temp,
  place,
  uvIndex,
  windStatus,
  sunrise,
  sunset,
  humidity,
  visibility,
  cloudCoverage,
  latitude,
  longitude,
  forcastItems = [];

mongoose.connect(process.env.MONGODB_URL+"weatherDataDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

UserSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", UserSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req, res) => {
  res.render("index");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/signin", (req, res) => {
  res.render("signin");
});

async function fetchWeatherDataForDefaultLocation() {
  try {
    const weatherAPI = "https://api.weatherapi.com/v1/forecast.json?key=" + process.env.WEATHER_API_KEY + "&q=Delhi,India&days=4&hour=2";
    const response = await axios.get(weatherAPI);
    const myData = response.data;
    // Populate variables with data
    icon = "https:" + myData.current.condition.icon;
    temp = myData.current.temp_c;
    description = myData.current.condition.text;
    place = myData.location.name + ", " + myData.location.country;
    uvIndex = myData.current.uv;
    windStatus = myData.current.wind_kph;
    humidity = myData.current.humidity;
    visibility = myData.current.vis_km;
    cloudCoverage = myData.current.cloud;
    latitude = myData.location.lat;
    latitude = latitude.toString();
    longitude = myData.location.lon;
    longitude = longitude.toString();
    forcastItems=[];
            for (var i = 0; i < 2; i++) {
              let forcastItem = []; 
              const date = new Date(myData.forecast.forecastday[i+1].date); 
              let forcastDate=myData.forecast.forecastday[i+1].date;
              let forcastDay=date.toLocaleDateString("en-US", {weekday: "long" });
              let forcastMinTemp=myData.forecast.forecastday[i+1].day.mintemp_c;
              let forcastMaxTemp=myData.forecast.forecastday[i+1].day.maxtemp_c;
              let forcastDescription=myData.forecast.forecastday[i+1].day.condition.text;
              let forcastIcon ="https:"+myData.forecast.forecastday[i+1].day.condition.icon;
              
              forcastItem.push(forcastDate);
              forcastItem.push(forcastDay);
              forcastItem.push(forcastMinTemp);
              forcastItem.push(forcastMaxTemp);
              forcastItem.push(forcastIcon);
              forcastItem.push(forcastDescription);
              forcastItems.push(forcastItem);
            }
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
  }
}


async function fetchSunriseAndSunset(latitude, longitude) {
  try {
    const sunAPI = "https://api.sunrisesunset.io/json?lat=" + latitude + "&lng=" + longitude;
    const response = await axios.get(sunAPI);
    const sunData = response.data.results;
    sunrise = sunData.sunrise;
    sunset = sunData.sunset;
  } catch (error) {
    console.error("Error fetching sunrise and sunset:", error.message);
  }
}

app.get("/homepage", async(req, res) => {
  if(req.isAuthenticated()){
  if (!latitude || !longitude) {
    await fetchWeatherDataForDefaultLocation();
    await fetchSunriseAndSunset(latitude, longitude);
  }

  const date = new Date();

  res.render("homepage", {
    icon: icon,
    date: new Date(Date.now()).toLocaleString().split(',')[0],
    day: date.toLocaleDateString("en-US", { weekday: "long" }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    temp: temp,
    description: description,
    place: place,
    uvIndex: uvIndex,
    windStatus: windStatus,
    sunrise: sunrise,
    sunset: sunset,
    humidity: humidity,
    visibility: visibility,
    cloudCoverage: cloudCoverage,
    forcastItems: forcastItems
  });
} else {
  res.redirect("/signin");
}
 
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

app.post("/homepage", (req, res) => {
  const query = req.body.searchPlace;
  const weatherAPI = "https://api.weatherapi.com/v1/forecast.json?key="+process.env.WEATHER_API_KEY+"&q="+query+"&days=4&hour=2";
  https.get(weatherAPI, (response) => {
    let weatherData = '';

    response.on("data", (chunk) => {
      weatherData += chunk;
    });
    response.on("end", () => {
      const myData = JSON.parse(weatherData);
      icon = "https:" + myData.current.condition.icon;
      temp = myData.current.temp_c; 
      description = myData.current.condition.text; 
      place = myData.location.name + ", " + myData.location.country;
      uvIndex = myData.current.uv;
      windStatus = myData.current.wind_kph;
      humidity = myData.current.humidity;
      visibility = myData.current.vis_km;
      cloudCoverage = myData.current.cloud;
      latitude = myData.location.lat;
      latitude = latitude.toString();
      longitude = myData.location.lon;
      longitude = longitude.toString();
      forcastItems=[];
            for (var i = 0; i < 2; i++) {
              let forcastItem = []; 
              const date = new Date(myData.forecast.forecastday[i+1].date); 
              let forcastDate=myData.forecast.forecastday[i+1].date;
              let forcastDay=date.toLocaleDateString("en-US", {weekday: "long" });
              let forcastMinTemp=myData.forecast.forecastday[i+1].day.mintemp_c;
              let forcastMaxTemp=myData.forecast.forecastday[i+1].day.maxtemp_c;
              let forcastDescription=myData.forecast.forecastday[i+1].day.condition.text;
              let forcastIcon ="https:"+myData.forecast.forecastday[i+1].day.condition.icon;
              
              forcastItem.push(forcastDate);
              forcastItem.push(forcastDay);
              forcastItem.push(forcastMinTemp);
              forcastItem.push(forcastMaxTemp);
              forcastItem.push(forcastIcon);
              forcastItem.push(forcastDescription);
              forcastItems.push(forcastItem);
            }
      const sunAPI =
        "https://api.sunrisesunset.io/json?lat=" +
        latitude +
        "&lng=" +
        longitude;
      https.get(sunAPI, (response) => {
        let sunData = '';
        response.on("data", (chunk) => {
          sunData += chunk;
        });
        response.on("end", () => {
          const sunDataParsed = JSON.parse(sunData);
          sunrise = sunDataParsed.results.sunrise;
          sunset = sunDataParsed.results.sunset;  
          res.redirect("/homepage");     
        });
      });           
    });
  });
});

app.post("/signup", (req, res) => {
  User.register(
    { username: req.body.username },
      req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, ()=>{
        res.redirect("/homepage");
        });
      }
    }
  );
});

app.post("/signin", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, ()=>{
      res.redirect("/homepage");
    });
    }
  }); 
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server is working");
});
