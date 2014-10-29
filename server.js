var fs = require('fs');
var tableData;

fs.readFile('data.json', 'utf8', function (error, data) {
	if (error) throw error;
	tableData = JSON.parse(data);
});

var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/data', function (req, res) {
	var
		sort = parseInt(req.query.sort, 10)|| 0,
		sortOrder = parseInt(req.query.sortOrder, 10)|| 1,
		offset = parseInt(req.query.offset, 10) || 0,
		limit = parseInt(req.query.limit, 10) || 100;

	tableData.sort(function compare(a, b) {
		if (a[sort] < b[sort]) {
			return -1 * sortOrder;
		}
		if (a[sort] > b[sort]) {
			return sortOrder;
		}
		return 0;
	});

	res.json(tableData.slice(offset, offset + limit))
});

app.listen(9090, function () {});