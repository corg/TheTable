$(function () {
	function init() {
		var table = new Table({
			container: '.table-container',
			columns: [
				{
					title: 'ID',
					type: 'string'
				},
				{
					title: 'Имя',
					type: 'string'
				},
				{
					title: 'Фамилия',
					type: 'string'
				},
				{
					title: 'Место работы',
					type: 'string'
				},
				{
					title: 'Динамика',
					type: 'number'
				},
				{
					title: 'Фаворит',
					type: 'boolean',
					disableSorting: true
				},
				{
					title: 'Что-то со ссылкой',
					type: 'string'
				}
			],
			pageSize: 100
		});

		table.loadData();
	}


	function Table(options) {
		this.container = $(options.container);
		this.rows = [];
		this.pageSize = options.pageSize || 100;

		this.header = new TableHeader(this, options.columns);

		var table = this;
		this.container.on('click', 'th .pseudo', function () {
			var newSortIndex = table.header.elements.index($(this).closest('th'));
			if (newSortIndex == table.sortIndex) {
				table.sortOrder = -1 * table.sortOrder;
			} else {
				table.sortOrder = 1;
			}
			window.scrollTo(0, 0);
			table.offset = 0;
			table.rows = [];
			table.sortIndex = newSortIndex;
			table.loadData();
		});

		this.loadMoreTrigger = $('.load-more-trigger')

		$(window).scroll(function () {
			if (table.loadMoreTrigger.offset().top <= window.scrollY + window.innerHeight && !table.dataLoading) {
				table.loadData();
			}
		})
	}


	Table.prototype.appendData = function (data) {
		data = $.isArray(data) ? data : [];

		if (!data.length) {
			this.loadMoreTrigger.hide();
		}

		for (var i = 0, l = data.length; i < l; i++) {
			this.rows.push(new TableRow(this, data[i]))
		}

		this.offset = (this.offset || 0) + data.length;
	};


	Table.prototype.render = function (offset) {
		var html = '';
		if (!offset) {
			 html += this.header.render();
		}
		for (var i = offset || 0, l = this.rows.length; i < l; i++) {
			html += this.rows[i].render();
		}

		if (offset) {
			this.container.append(html);
		} else {
			this.container.get(0).innerHTML = html;
		}

		this.header.elements = this.container.find('th');
	};


	Table.prototype.loadData = function () {
		$.getJSON('/data',
			{
				limit: this.pageSize,
				offset: this.offset,
				sort: this.sortIndex,
				sortOrder: this.sortOrder
			},
			function (data) {
				var prevOffset = this.offset;
				this.appendData(data);
				this.render(prevOffset);
			}.bind(this));
	};


	function TableHeader(parentTable, columns) {
		this.parentTable = parentTable;
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


	function TableRow(parentTable, data) {
		this.parentTable = parentTable;
		this.data = data;
		this.cells = [];

		for (var i = 0, l = this.data.length; i < l; i++) {
			this.cells.push(this.createCell(this.data[i], this.parentTable.header.columns[i].type));
		}
	}


	TableRow.prototype.createCell = function (value, type) {
		var newCell;

		if (type === 'boolean') {
			newCell = new TableBooleanCell(value);
		} else if (type === 'number') {
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


	init();
});
