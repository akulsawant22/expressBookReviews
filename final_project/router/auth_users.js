const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
    // A username is valid (available) if no existing user already has it
    let sameName = users.filter((user) => user.username === username);
    return sameName.length === 0;
}

const authenticatedUser = (username,password)=>{ //returns boolean
    let validUsers = users.filter((user) => user.username === username && user.password === password);
    return validUsers.length > 0;
}

//only registered users can login
const loginUser = (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in: username and password are required" });
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({ data: username }, 'access', { expiresIn: 60 * 60 });
        req.session.authorization = { accessToken, username };
        return res.status(200).json({ message: "User successfully logged in", accessToken });
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
};

regd_users.post("/login", loginUser);

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review || (req.body && req.body.review);
    const username = req.session.authorization['username'];

    if (!books[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
    if (!review) {
        return res.status(400).json({ message: "Review text is required" });
    }

    books[isbn].reviews[username] = review;
    return res.status(200).json({
        message: `The review for the book with ISBN ${isbn} has been added/updated.`,
        reviews: books[isbn].reviews
    });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization['username'];

    if (!books[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
    if (books[isbn].reviews[username]) {
        delete books[isbn].reviews[username];
        return res.status(200).json({
            message: `Review for the ISBN ${isbn} posted by the user ${username} deleted.`,
            reviews: books[isbn].reviews
        });
    }
    return res.status(404).json({ message: `No review found for ISBN ${isbn} by user ${username}` });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports.loginUser = loginUser;
const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
    // A username is valid (available) if no existing user already has it
    let sameName = users.filter((user) => user.username === username);
    return sameName.length === 0;
}

const authenticatedUser = (username,password)=>{ //returns boolean
    let validUsers = users.filter((user) => user.username === username && user.password === password);
    return validUsers.length > 0;
}

//only registered users can login
regd_users.post("/login", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in: username and password are required" });
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({ data: username }, 'access', { expiresIn: 60 * 60 });
        req.session.authorization = { accessToken, username };
        return res.status(200).json({ message: "User successfully logged in", accessToken });
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review || (req.body && req.body.review);
    const username = req.session.authorization['username'];

    if (!books[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
    if (!review) {
        return res.status(400).json({ message: "Review text is required" });
    }

    books[isbn].reviews[username] = review;
    return res.status(200).json({
        message: `The review for the book with ISBN ${isbn} has been added/updated.`,
        reviews: books[isbn].reviews
    });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization['username'];

    if (!books[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
    if (books[isbn].reviews[username]) {
        delete books[isbn].reviews[username];
        return res.status(200).json({
            message: `Review for the ISBN ${isbn} posted by the user ${username} deleted.`,
            reviews: books[isbn].reviews
        });
    }
    return res.status(404).json({ message: `No review found for ISBN ${isbn} by user ${username}` });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
