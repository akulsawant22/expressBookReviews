const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Base URL of this server. The Axios helpers below call these public endpoints.
const BASE_URL = "http://localhost:5000";

/* ---------------------------------------------------------------------
   Promise-based data access helpers.
   Each helper wraps the book lookup in a Promise so that the route
   handlers can consume it with async/await or .then()/.catch().
   --------------------------------------------------------------------- */

// Resolve with the complete list of books
const fetchAllBooks = () => {
    return new Promise((resolve, reject) => {
        if (books) {
            resolve(books);
        } else {
            reject({ status: 500, message: "Book list is not available" });
        }
    });
};

// Resolve with a single book matching the ISBN, or reject with 404
const fetchBookByISBN = (isbn) => {
    return new Promise((resolve, reject) => {
        if (books[isbn]) {
            resolve(books[isbn]);
        } else {
            reject({ status: 404, message: `Book with ISBN ${isbn} not found` });
        }
    });
};

// Resolve with every book written by the given author (case-insensitive)
const fetchBooksByAuthor = (author) => {
    return new Promise((resolve, reject) => {
        const booksbyauthor = Object.keys(books)
            .filter((isbn) => books[isbn].author.toLowerCase() === author.toLowerCase())
            .map((isbn) => ({ isbn: isbn, author: books[isbn].author, title: books[isbn].title, reviews: books[isbn].reviews }));
        if (booksbyauthor.length > 0) {
            resolve(booksbyauthor);
        } else {
            reject({ status: 404, message: `No books found by author ${author}` });
        }
    });
};

// Resolve with every book matching the given title (case-insensitive)
const fetchBooksByTitle = (title) => {
    return new Promise((resolve, reject) => {
        const booksbytitle = Object.keys(books)
            .filter((isbn) => books[isbn].title.toLowerCase() === title.toLowerCase())
            .map((isbn) => ({ isbn: isbn, author: books[isbn].author, title: books[isbn].title, reviews: books[isbn].reviews }));
        if (booksbytitle.length > 0) {
            resolve(booksbytitle);
        } else {
            reject({ status: 404, message: `No books found with title ${title}` });
        }
    });
};

// Send a uniform error response for both Promise rejections and Axios errors
const sendError = (res, error, fallbackMessage) => {
    if (error && error.response) {
        // Error returned by an Axios request
        return res.status(error.response.status).json(error.response.data);
    }
    const status = (error && error.status) || 500;
    const message = (error && error.message) || fallbackMessage;
    return res.status(status).json({ message: message });
};

/* ---------------------------------------------------------------------
   Registration
   --------------------------------------------------------------------- */

// Register a new user
public_users.post("/register", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Unable to register user. Username and password are required." });
    }
    if (!isValid(username)) {
        return res.status(404).json({ message: "User already exists!" });
    }
    users.push({ username: username, password: password });
    return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

/* ---------------------------------------------------------------------
   Tasks 1-4 / 10-13: public book routes implemented with
   async/await and Promise callbacks.
   --------------------------------------------------------------------- */

// Task 1 & 10: Get the book list available in the shop (async/await)
public_users.get('/', async function (req, res) {
    try {
        const allBooks = await fetchAllBooks();
        return res.status(200).send(JSON.stringify(allBooks, null, 4));
    } catch (error) {
        return sendError(res, error, "Error retrieving book list");
    }
});

// Task 2 & 11: Get book details based on ISBN (Promise callbacks)
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    fetchBookByISBN(isbn)
        .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
        .catch((error) => sendError(res, error, "Error retrieving book by ISBN"));
});

// Task 3 & 12: Get book details based on author (async/await)
public_users.get('/author/:author', async function (req, res) {
    try {
        const booksbyauthor = await fetchBooksByAuthor(req.params.author);
        return res.status(200).send(JSON.stringify({ booksbyauthor }, null, 4));
    } catch (error) {
        return sendError(res, error, "Error retrieving books by author");
    }
});

// Task 4 & 13: Get all books based on title (async/await)
public_users.get('/title/:title', async function (req, res) {
    try {
        const booksbytitle = await fetchBooksByTitle(req.params.title);
        return res.status(200).send(JSON.stringify({ booksbytitle }, null, 4));
    } catch (error) {
        return sendError(res, error, "Error retrieving books by title");
    }
});

// Task 5: Get book review
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    fetchBookByISBN(isbn)
        .then((book) => res.status(200).send(JSON.stringify(book.reviews, null, 4)))
        .catch((error) => sendError(res, error, "Error retrieving book reviews"));
});

/* ---------------------------------------------------------------------
   Tasks 10-13 with Axios: client functions that retrieve the data from
   the endpoints above using Axios, plus routes that expose them.
   --------------------------------------------------------------------- */

// Task 10: Get all books using Axios with async/await
const getAllBooks = async () => {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
};

// Task 11: Get book details by ISBN using Axios with Promise callbacks
const getBookByISBN = (isbn) => {
    return axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
        .then((response) => response.data);
};

// Task 12: Get book details by author using Axios with async/await
const getBooksByAuthor = async (author) => {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
};

// Task 13: Get book details by title using Axios with async/await
const getBooksByTitle = async (title) => {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
};

// Route using Axios + async/await to get all books
public_users.get('/axios/books', async (req, res) => {
    try {
        const data = await getAllBooks();
        return res.status(200).send(JSON.stringify(data, null, 4));
    } catch (error) {
        return sendError(res, error, "Error fetching book list with Axios");
    }
});

// Route using Axios + Promise callbacks to get a book by ISBN
public_users.get('/axios/isbn/:isbn', (req, res) => {
    getBookByISBN(req.params.isbn)
        .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
        .catch((error) => sendError(res, error, "Error fetching book by ISBN with Axios"));
});

// Route using Axios + async/await to get books by author
public_users.get('/axios/author/:author', async (req, res) => {
    try {
        const data = await getBooksByAuthor(req.params.author);
        return res.status(200).send(JSON.stringify(data, null, 4));
    } catch (error) {
        return sendError(res, error, "Error fetching books by author with Axios");
    }
});

// Route using Axios + async/await to get books by title
public_users.get('/axios/title/:title', async (req, res) => {
    try {
        const data = await getBooksByTitle(req.params.title);
        return res.status(200).send(JSON.stringify(data, null, 4));
    } catch (error) {
        return sendError(res, error, "Error fetching books by title with Axios");
    }
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
