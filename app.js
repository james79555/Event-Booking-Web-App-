const express = require('express');
const path = require('path');

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

app.use('/events', eventRoutes);
app.use('/users', userRoutes);
app.use('/bookings', bookingRoutes);

module.exports = app;

app.listen(port, () => {
    console.log(`Server is running on localhost:${port}`);
});