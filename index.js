const express = require("express");
const sqlite3 = require("sqlite3");
const util = require("util");
const uuid = require("uuid");
const btoa = require("btoa");
const atob = require("atob");
const cors = require("cors");

const save = new sqlite3.Database("./save.db");
save.run = util.promisify(save.run);
save.get = util.promisify(save.get);
save.all = util.promisify(save.all);

async function setupSave() {
	await save.run("CREATE TABLE IF NOT EXISTS saveTable (id TEXT PRIMARY KEY, value TEXT)");
}

const app = express();
app.use(cors());
app.use(express.json());

async function isUnique(id) {
	let res = await save.all("SELECT * FROM saveTable WHERE id=?", [id]);
	return res.length == 0;
}

app.post("/save", async function (req, res, next) {
	let input = btoa(JSON.stringify(req.body));
	let id = uuid.v4();
	while (!(await isUnique(id))) {
		id = uuid.v4();
	}
	await save.run("INSERT INTO saveTable (id, value) VALUES (?, ?)", [id, input]);
	res.status(201);
	res.send(JSON.stringify({
		id: id
	}));
});

app.put("/save/:id", async function (req, res, next) {
	let input = btoa(JSON.stringify(req.body));
	let id = req.params.id;
	await save.run("UPDATE saveTable SET value=? WHERE id=?", [input, id]);
	res.status(200);
	res.send("");
});

app.get("/load/:id", async function (req, res, next) {
	let id = req.params.id;
	let x = await save.all("SELECT * FROM saveTable WHERE id=?", [id]);
	if (x.length == 0) {
		res.status(404);
		res.send("");
	}
	else {
		res.status(200);
		res.send(atob(x[0].value));
	}
});

setupSave().then(() => {
	const listener = app.listen(3001, () => {});
});