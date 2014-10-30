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
		this.columns = options.columns;
		this.rows = [];
		this.pageSize = options.pageSize || 100;

		this.header = new TableHeader({
			tableContainerElement: this.container,
			columns: this.columns,
			onSort: this.sort.bind(this)
		});

		this.loadingIndicator = new LoadingIndicator();

		$(window).scroll(function () {
			if (!this.dataLimitReached && document.body.clientHeight - 50 <= window.scrollY + window.innerHeight && !this.isBusy()) {
				this.loadData();
			}
		}.bind(this))
	}


	Table.prototype.appendData = function (data) {
		data = $.isArray(data) ? data : [];

		if (!data.length) {
			this.dataLimitReached = true;
		}

		for (var i = 0, l = data.length; i < l; i++) {
			this.rows.push(new TableRow(this.columns, data[i]))
		}

		this.offset = (this.offset || 0) + data.length;
	};


	Table.prototype.render = function (offset) {
		var html = '';
		if (!offset) {
			 html += this.header.render(this.sortIndex, this.sortOrder);
		}
		for (var i = offset || 0, l = this.rows.length; i < l; i++) {
			html += this.rows[i].render();
		}

		if (offset) {
			this.container.append(html);
		} else {
			this.container.get(0).innerHTML = html;
		}
	};


	Table.prototype.loadData = function () {
		this.setBusyStatus();
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
				this.removeBusyStatus();
			}.bind(this));
	};


	Table.prototype.sort = function (sortIndex) {
		if (sortIndex === this.sortIndex) {
			this.sortOrder = -1 * this.sortOrder;
		} else {
			this.sortOrder = 1;
		}
		window.scrollTo(0, 0);
		this.offset = 0;
		this.rows = [];
		this.sortIndex = sortIndex;
		this.loadData();
	};


	Table.prototype.isBusy = function () {
		return this.busy;
	};


	Table.prototype.setBusyStatus = function () {
		this.busy = true;
		this.loadingIndicator.show();
	};


	Table.prototype.removeBusyStatus = function () {
		this.busy = false;
		this.loadingIndicator.hide();
	};


	function TableHeader(options) {
		this.columns = $.isArray(options.columns) ? options.columns : [];
		this.sortOrderIcons = {
			'1': '&uarr;',
			'-1': '&darr;'
		};

		if ($.isFunction(options.onSort)) {
			$(options.tableContainerElement).on('click', 'th .pseudo', function () {
				var sortIndex = $(options.tableContainerElement).find('th').index($(this).closest('th'));

				options.onSort(sortIndex);
			});
		}
	}



	TableHeader.prototype.render = function (sortIndex, sortOrder) {
		var html = '';
		for (var i = 0, l = this.columns.length; i < l; i++) {
			html += '<th>' +
				'<div class="header_placeholder">' + this.columns[i].title + '</div>' +
				'<div class="header_sticky">' +
					(this.columns[i].disableSorting ? this.columns[i].title	: '<span class="pseudo">' + this.columns[i].title + '</span>') +
					(sortIndex === i ? ' <span class="header__sort-icon">' + this.sortOrderIcons[sortOrder] + '</span>' : '') +
				'</div>' +
				'</th>';
		}

		return '<tr>' + html + '</tr>';
	};



	function TableRow(columns, data) {
		this.data = data;
		this.cells = [];

		for (var i = 0, l = this.data.length; i < l; i++) {
			this.cells.push(this.createCell(this.data[i], columns[i].type));
		}
	}


	TableRow.prototype.createCell = function (value, type) {
		if (type === 'boolean') {
			return new TableBooleanCell(value);
		}
		if (type === 'number') {
			return new TableNumberCell(value);
		}

		return new TableCell(value);
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


	function LoadingIndicator() {
		this.element = $('.loading-indicator').hide();
	}


	LoadingIndicator.prototype.show = function () {
		this.element.show();
	};


	LoadingIndicator.prototype.hide = function () {
		this.element.hide();
	};


	init();
});
