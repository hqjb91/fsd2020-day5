// Load libraries
const express = require('express');
const hbs = require('express-handlebars');
const fetch = require('node-fetch');
const withQuery = require('with-query').default;

// Set up access to process environment variables
require('dotenv').config();

// Set up port
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

// Set up variables to store state of previous searches
const countries = [{country:'us',checked:''}, {country:'gb',checked:''}, {country:'jp',checked:''}, {country:'sg' ,checked:''}, {country:'fr',checked:''}, {country:'cn', checked:''}];
const categories = [{category:'Business',selected:''}, {category:'Entertainment',selected:''}, {category:'General',selected:''}, {category:'Health',selected:''}, {category:'Science',selected:''}, {category:'Sports',selected:''}, {category:'Technology',selected:''}];
const cache = [];

// Create an instance of express
const app = express();

// Configure handlebars
app.engine('hbs', hbs({ defaultLayout: 'default.hbs'}));
app.set('view engine', 'hbs');

// Serve up static files
app.use(express.static(__dirname + '/static'));

// Configure the routes
// Load landing page
app.get('/', (req, res) => {

    categories.forEach(e => e.selected=''); // Reset remembered categories
    countries.forEach(e => e.checked=''); // Reset remembered country

    res.status(200);
    res.type('text/html');
    res.render('index', {
        countries, categories
    });
});

// Handle form request
app.post('/', express.urlencoded({extended:true}), async (req, res) => {

    const searchTerms = {q, country, category} = req.body;
    const timeNow = new Date();
    const matchedArticles = cache.filter(e=>{
        return (JSON.stringify(e.searchTerms) === JSON.stringify(searchTerms)) && 
        (((timeNow.getTime() - e.date.getTime())/(1000 * 3600 * 24)) < 1);
    }); // Check if not expired and matched

    categories.forEach(e => {
        if(e.category === category) {e.selected='selected'} else {e.selected=''};
    }); // Remember previous category

    countries.forEach(e => {
        if(e.country === country) {e.checked='checked'} else {e.checked=''};
    }); // Remember previous country

    let articles = [];

    // Check if cached and not expired and load from cache else fetch from API and push into cache
    if(matchedArticles.length > 0) {
        console.log('Searched before and articles cached are returned');
        articles = matchedArticles[0].articles;
    } else {
        const endpoint = 'https://newsapi.org/v2/top-headlines';
        //const url = withQuery(endpoint, { q, apiKey: process.env.API_KEY, country, category });
        const url = withQuery(endpoint, { q, country, category });

        const results = await fetch(url, { method: 'GET', headers: {'X-Api-Key':process.env.API_KEY}});
        const resultsJSON = await results.json();
        
        articles = resultsJSON.articles.map((article) => {
            const {title, urlToImage, description, publishedAt, url} = article;
            return { title, urlToImage, description, publishedAt, url };
        });

        // Store in cache
        cache.push({searchTerms, articles, date: timeNow});
    }

    // Check if search returned any results
    const isArticlesEmpty = (articles.length < 1);

    // Check if all inputs are filled in
    const isNotFilledIn = q.length < 1 || (typeof country !== 'string');

    res.status(200);
    res.type('text/html');
    res.render('index', {searchTerms, countries, categories, articles, isArticlesEmpty, isNotFilledIn});

});

// Start server
app.listen(PORT, () => {
    console.log(`You are connected on port : ${PORT} at ${new Date()}.`);
});