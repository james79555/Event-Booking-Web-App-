const showRegistrationForm = (req, res) => {
    res.send('registration form');
}

const processRegistration = (req, res) => {
    res.send('user registered');
}

const showLoginForm = (req, res) => {
    res.send('login page'); 
}

const processLogin = (req, res) => {
    res.send('login processed'); 
}

const showProfile = (req, res) => {
    res.send('user profile page');
}