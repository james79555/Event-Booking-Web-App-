const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express()
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized:false
}));

app.use(flash());
app.use((req, res, next) => {
    res.locals.successMsg = req.flash('success');
    res.locals.errorMsg = req.flash('error');

    next();
});

app.use((req, res, next) => {
    res.locals.userId = req.session.userId;

    next();
});

app.use('/events', eventRoutes);
app.use('/users', userRoutes);
app.use('/bookings', bookingRoutes);

app.get('/', (req, res) => {
    res.redirect('/events');
});

module.exports = app;


if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on localhost:${port}`);
    });
}
