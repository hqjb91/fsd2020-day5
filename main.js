// Load libraries
const express = require('express');
const hbs = require('express-handlebars');
const fetch = require('node-fetch');
const withQuery = require('with-query').default;

// Set up access to process environment variables
require('dotenv').config();

// Set up port
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

// Set up variables
const countries = ['us', 'gb', 'jp', 'sg' , 'fr', 'cn'];
const categories = ['Business', 'Entertainment', 'General', 'Health', 'Science', 'Sports', 'Technology'];
const cache = [];

// Create an instance of express
const app = express();

// Configure handlebars
app.engine('hbs', hbs({ defaultLayout: 'default.hbs'}));
app.set('view engine', 'hbs');

// Serve up static files
app.use(express.static(__dirname + '/static'));

// Configure the routes
app.get('/', (req, res) => {

    res.status(200);
    res.type('text/html');
    res.render('index', {
        countries, categories
    });
});

app.post('/', express.urlencoded({extended:true}), async (req, res) => {

    const searchTerms = {};
    const endpoint = 'https://newsapi.org/v2/top-headlines'
    const url = withQuery(endpoint, {
        q: req.body.newsSearch,
        apiKey: process.env.API_KEY,
        country: req.body.countries,
        category: req.body.categories.toLowerCase(),
    });

    const results = await fetch(url);
    const resultsJSON = await results.json();
    
    const articles = resultsJSON.articles.map((article) => {
        return { 
            title: article.title,
            urlToImage: article. urlToImage,
            description: article.description,
            publishedAt: article.publishedAt,
            url: article.url }
    });

    // Store in cache
    cache.push({})

    res.status(200);
    res.type('text/html');
    res.render('index', {countries, categories, articles});

});

// Start server
app.listen(PORT, () => {
    console.log(`You are connected on port : ${PORT} at ${new Date()}.`)
})