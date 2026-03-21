const showUserBookings = (req, res) => {
    res.send("list of user's bookings");
}

const processBooking = (req, res) => {
    res.status(200).send('booking processed');
}