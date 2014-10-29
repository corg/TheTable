$(function () {
	var table = new Table('.table-container');

	$.getJSON('data.json', function (data) {
		table.appendData(data);
		table.render();
	});


	function Table(tableContainer, data) {
		this.tableContainer = $(tableContainer).get(0);
		this.rows = [];
	}

	Table.prototype.appendData = function (data) {
		this.data = $.isArray(data) ? data : [];

		for (var i = 0, l = this.data.length; i < l; i++) {
			this.rows.push(new TableRow(this.data[i]))
		}
	};

	Table.prototype.render = function () {
		var html = '';
		for (var i = 0, l = this.rows.length; i < l; i++) {
			html += this.rows[i].render();
		}

		this.tableContainer.innerHTML = '<table>' + html + '</table>';
	};


	function TableRow(data) {
		this.data = data;
		this.cells = [];

		for (var i = 0, l = this.data.length; i < l; i++) {
			this.cells.push(this.createCell(this.data[i]));
		}
	}

	TableRow.prototype.createCell = function (value) {
		var newCell;

		if (typeof value === 'boolean') {
			newCell = new TableBooleanCell(value);
		} else if (typeof value === 'number') {
			newCell = new TableNumberCell(value);
		} else {
			newCell = new TableCell(value);
		}

		newCell.value = value;

		return newCell;
	};

	TableRow.prototype.render = function () {
		var html = '';
		for (var i = 0, l = this.cells.length; i < l; i++) {
			html += this.cells[i].render();
		}
		return '<tr>' + html + '</tr>';
	};


	function TableCell(value) {
		// простейший поиск ссылок: конец ссылки определяется пробелом или концом строки
		this.displayValue = value.replace(/(https?:\/\/.*?)(\s|$)/, '<a href="$1" target="_blank">$1</a>$2');
	}

	TableCell.prototype.render = function () {
		return '<td>' + this.displayValue + '</td>';
	};


	function TableNumberCell(value) {
		this.displayValue = Math.round(value);
		this.displayValue = (this.displayValue + '').replace('-', '&minus;')
		this.cellClass = 'cell_type_number';
		if (value > 0) {
			this.cellClass += ' cell_positive_yes';
		}
		if (value < 0) {
			this.cellClass += ' cell_positive_no';
		}
	}

	TableNumberCell.prototype.render = function () {
		return '<td class="' + this.cellClass + '">' + this.displayValue + '</td>';
	};


	function TableBooleanCell(value) {
		this.displayValue = value ? 'Да' : 'Нет';
	}

	TableBooleanCell.prototype.render = TableCell.prototype.render;
});