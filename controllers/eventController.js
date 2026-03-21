const getAllEvents = (req, res) => {
    res.send("list of all events");
}

const processBooking = (req, res) => {
    res.send("Details for event with ID: " + req.params.id);
}