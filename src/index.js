const { response } = require('express');
const { request } = require('express');
const { v4: uuidv4 } = require("uuid");

const express = require('express');

const app = express();

app.use(express.json());

const customers = [];

//middleware
function verifyToken(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return response.status(401).json({ error: 'Customer not found' });
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.value;
        } else {
        return acc - operation.value;
        }
    },0);
    return balance;
}

//account
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

//statement
app.get("/statement/", verifyToken, (request, response) => {
    
    const { customer } = request;

    return response.json(customer.statement);

});

app.post("/deposit" , verifyToken, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    };
    customer.statement.push(statementOperation);

    return response.status(201).send();

});

app.post("/withdraw", verifyToken, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);
    
    if (balance < amount) {
        return response.status(400).json({error: 'Insufficient balance'});
    }

    const statementOperation = {
        description: "Withdraw",
        amount,
        created_at: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.get("/statement/date" , verifyToken, (request, response) => {
    const { customer } = request;
    const { date } = request.query;
    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        statement => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    );

    return response.json(statement);
});

app.delete("/account", verifyToken, (request, response) => {
    const { customer } = request;

    const index = customers.indexOf(customer);

    customers.splice(index, 1);

    return response.status(200).json(customers);
});

app.listen(3000); 