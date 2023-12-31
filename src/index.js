//criação da conta
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();

app.use(express.json());

const customers = [];

//Abaixo é o MiddleWare
function verifyIfExistsAccountCpf(req, res, next) {
	const { cpf } = req.headers;
	//desestruturação {}

	const customer = customers.find((customer) => customer.cpf === cpf);

	if (!customer) {
		res.status(400).json({ message: "Customer not found!" });
	}
	req.customer = customer;
	next();
}

// Abaixo função para verificar e somar das operações (saque, depósito)
function getBalance(statement) {
	const balance = statement.reduce((acc, operation) => {
		if (operation.type === "credit") {
			return acc + operation.amount;
		} else {
			return acc - operation.amount;
		}
	}, 0);

	return balance;
}

//checando se o usuário está cadastrado
app.post("/account", (req, res) => {
	const { cpf, name } = req.body;

	const customersAlreadyExists = customers.some(
		(customers) => customers.cpf === cpf
	);

	if (customersAlreadyExists) {
		return res.status(400).json({
			message: "Customer already exists!",
		});
		//Criando o usuário após a verificação
	}
	customers.push({
		cpf,
		name,
		id: uuidv4(),
		statement: [],
	});
	console.log(customers);
	return res.status(201).json({
		message: "Customer created success!",
	});
});

app.use(verifyIfExistsAccountCpf);

//Listando
app.get("/account", (req, res) => {
	const { customer } = req;

	return res.json({
		message: "Success",
		customer,
	});
});

//Atualizando os dados da conta
app.patch("/account", (req, res) => {
	const { customer } = req;
	const { name } = req.body;

	customer.name = name;

	return res.json({ message: "Account updated!" });
});

//deletar a conta
app.delete("/account", (req, res) => {
	const { customer } = req;

	customers.splice(customers.indexOf(customers.cpf), -1);

	return res.json({
		message: "Account deleted!",
		customers,
	});
});

app.get('/statement', (req, res) => {
  const {customer} = req;

  return res.json({
    message: "Success",
    statement: customer.statement
  });
})

//Extrato
app.get("/statement/date", (req, res) => {
	const { customer } = req;
  const {date} = req.query;
 
  const dateFormat = new Date(date + " 00:00");

	const statement = customer.statement.filter(
    (statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
  )
  return res.json({message:"Filtering by date", statement})

	});


//Deposito
app.post("/deposit", (req, res) => {
	const { customer } = req;
	const { amount, description } = req.body;

	const statementOperation = {
		amount,
		description,
		created_at: new Date(),
		type: "credit",
	};

	customer.statement.push(statementOperation);
	return res.status(201).json({ message: "Successfully deposited!" });
});

//Saque
app.post("/withdraw", (req, res) => {
	const { customer } = req;
	const { amount } = req.body;

	const balance = getBalance(customer.statement);

	if (balance < amount) {
		return res.status(400).json({ message: "Insuficient funds!" });
	}

	const statementOperation = {
		amount,
		created_at: new Date(),
		type: "debit",
	};

	customer.statement.push(statementOperation);
	return res.status(201).json({ message: "Successfully withdraw!" });
});

app.get("/balance", (req, res) => {
	const { customer } = req;

	const balance = getBalance(customer.statement);

	return res.json({ message: "Successs", balance });
});

app.listen(3333);
