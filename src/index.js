const { response } = require('express');
const { request } = require('express');
const { v4: uuidv4 } = require("uuid");

const express = require('express');

const app = express();

app.use(express.json());

const customers = [];

app.post('/account', (request, response) => {
    const { id, name, cpf, password, statement } = request.body;

    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

    if (customerAlreadyExists) {
        return response.status(400).json({
            error: 'Customer already exists'
        });
    }

    customers.push({
        id: uuidv4(),
        name,
        cpf,
        password,
        statement: []
    });
    
    return response.status(201).json({
        id,
        name,
        cpf,
        password,
    });

});

app.get("/statement/", (request, response) => {
    const { cpf } = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);
    if (!customer) {
        return response.status(400).json({
            error: 'Customer not found'
        });
    }

    return response.json(customer.statement);

});

app.listen(3000);