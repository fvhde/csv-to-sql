const fs = require('fs'); 
const express = require('express');
const initSqlJs = require('sql.js');
const Papa = require('papaparse');
const app = express();
const port = process.env.PORT || 8000;

const readData = () => {
	const csvFile = fs.readFileSync('./users.csv')
	const csvData = csvFile.toString() 

	return new Promise((resolve, reject) => {
		Papa.parse(csvData, {
			complete: results => {
			  console.log('Complete', results.data.length, 'records.');
			  resolve(results.data);
			}
		  });
	});
  };
  
const createTable = async (data) => {  
	const SQL = await initSqlJs({});
	const db = new SQL.Database();

	const cols = data.shift();
	const query = `CREATE TABLE "users" (${cols
	  .map(col => `"${col}" TEXT`)
	  .join(",")});`;
	db.run(query);
  
	try {
	  const insertStmt = db.prepare(
		`INSERT INTO "users" VALUES (${cols.map(val => "?").join(",")})`
	  );
	  for (const row of data) {
		if (row.length !== cols.length) {
		  console.log("skipping row", row);
		  continue;
		}
  
		insertStmt.run(row);
	  }
	  insertStmt.free();
	} catch (err) {
	  db.run(`DROP TABLE IF EXISTS "users"`);
	  throw err;
	}
  
	return db;
};

const request = async (query) => {
	let results = await db.exec(`SELECT * FROM users WHERE "username"="booker12"`);
	return results.pop().values;
}

app.get('/', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(await request(req.query)));
});

app.listen(port, async () => {
	db = await createTable(await readData());
    console.log('Server app listening on port ' + port);
});