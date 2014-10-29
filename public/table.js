$(function () {
	var table = new Table('.table-container', [
		{ title: 'ID' },
		{ title: 'Имя' },
		{ title: 'Фамилия' },
		{ title: 'Место работы' },
		{ title: 'Динамика' },
		{ title: 'Фаворит', disableSorting: true },
		{ title: 'Что-то со ссылкой' }
	]);

	function loadData(limit, offset, sort, sortOrder) {
		$.getJSON('/data',
			{
				limit: limit,
				offset: offset,
				sort: sort,
				sortOrder: sortOrder
			},
			function (data) {
				table.appendData(data);
				table.render();
			});
	}

	loadData(1000);


	function Table(tableContainer, columns) {
		this.tableContainer = $(tableContainer);
		this.rows = [];

		this.header = new TableHeader(columns);
		this.header.parentTable = this;

		var table = this;
		this.tableContainer.on('click', 'th .pseudo', function () {
			var newSortIndex = table.header.elements.index($(this).closest('th'));
			if (newSortIndex == table.sortIndex) {
				table.sortOrder = -1 * table.sortOrder;
			} else {
				table.sortOrder = 1;
			}
			table.sortIndex = newSortIndex;
			loadData(1000, 0, table.sortIndex, table.sortOrder);
		})
	}

	Table.prototype.appendData = function (data) {
		this.data = $.isArray(data) ? data : [];

		this.rows = [];

		for (var i = 0, l = this.data.length; i < l; i++) {
			this.rows.push(new TableRow(this.data[i]))
		}
	};

	Table.prototype.render = function () {
		var html = this.header.render();
		for (var i = 0, l = this.rows.length; i < l; i++) {
			html += this.rows[i].render();
		}

		this.tableContainer.get(0).innerHTML = '<table>' + html + '</table>';
		this.header.elements = this.tableContainer.find('th');
	};


	function TableHeader(columns) {
		this.columns = $.isArray(columns) ? columns : [];
		this.sortOrderIcons = {
			'1': '&uarr;',
			'-1': '&darr;'
		}
	}

	TableHeader.prototype.render = function () {
		var html = '';
		for (var i = 0, l = this.columns.length; i < l; i++) {
			html += '<th>' +
				'<div class="header_placeholder">' + this.columns[i].title + '</div>' +
				'<div class="header_sticky">' +
					(this.columns[i].disableSorting ? this.columns[i].title	: '<span class="pseudo">' + this.columns[i].title + '</span>') +
					(this.parentTable.sortIndex == i ? ' <span class="header__sort-icon">' + this.sortOrderIcons[this.parentTable.sortOrder] + '</span>' : '') +
				'</div>' +
				'</th>';
		}

		return '<tr>' + html + '</tr>';
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
		this.displayValue = (this.displayValue + '').replace('-', '&minus;');
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