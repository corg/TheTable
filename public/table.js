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


	/**
	 * Создает таблицу
	 * @param options Конфиг
	 * @param options.container jQuery-элемент (или селектор) с тегом table
	 * @param options.columns Массив с конфигом колонок
	 * @param options.pageSize Начальное количество строк и величина доргужаемых позже "порций"
	 * @constructor
	 */
	function Table(options) {
		this.headerContainer = $(options.container).find('thead');
		this.bodyContainer = $(options.container).find('tbody');
		this.columns = options.columns;
		this.rows = [];
		this.pageSize = options.pageSize || 100;

		this.header = new TableHeader({
			columns: this.columns,
			onSort: this.sort.bind(this)
		});
		this.headerContainer.append(this.header.container);

		this.loadingIndicator = new LoadingIndicator();

		this.loadSortingSettings();

		$(window).scroll(function () {
			if (!this.dataLimitReached && document.body.clientHeight - 50 <= document.documentElement.scrollTop + window.innerHeight && !this.isBusy()) {
				this.loadData();
			}
		}.bind(this))
	}


	/**
	 * Создает на основе переданных данных строки таблицы, и добавляет их к таблице
	 * @param data Массив новых строк таблицы
	 */
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


	/**
	 * Создает HTML строк таблицы, и выводит его
	 * @param offset Индекс начала новых данных, которые будут добавлены к верстке
	 */
	Table.prototype.render = function (offset) {
		var html = '';
		if (!offset) {
			this.header.render(this.sortIndex, this.sortOrder);
		}
		for (var i = offset || 0, l = this.rows.length; i < l; i++) {
			html += this.rows[i].render();
		}

		if (offset) {
			this.bodyContainer.append(html);
		} else {
			this.bodyContainer.get(0).innerHTML = html;
		}
	};


	/**
	 * Обращается к серверу за данными, инициирует обработку и вывод полученных данных
	 */
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


	/**
	 * Обработка сортировки таблицы
	 * @param sortIndex Номер колонки, по которой происходит сортировка
	 */
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
		this.saveSortingSettings();
		this.loadData();
	};


	/**
	 * Показывает, "занята" ли таблица (загружаются ли данные)
	 * @returns {boolean}
	 */
	Table.prototype.isBusy = function () {
		return this.busy;
	};


	/**
	 * Выставляет флаг загрузки
	 */
	Table.prototype.setBusyStatus = function () {
		this.busy = true;
		this.loadingIndicator.show();
	};

	/**
	 * Снимает флаг загрузки
	 */
	Table.prototype.removeBusyStatus = function () {
		this.busy = false;
		this.loadingIndicator.hide();
	};


	Table.prototype.saveSortingSettings = function () {
		if (isNaN(this.sortIndex) || isNaN(this.sortOrder)) {
			return;
		}

		localStorage.setItem('sortIndex', this.sortIndex);
		localStorage.setItem('sortOrder', this.sortOrder);
	};


	Table.prototype.loadSortingSettings = function () {
		this.sortIndex = localStorage.getItem('sortIndex');
		this.sortOrder = localStorage.getItem('sortOrder');
		if (!isNaN(this.sortIndex) && !isNaN(this.sortOrder)) {
			this.sortIndex = parseInt(this.sortIndex, 10);
			this.sortOrder = parseInt(this.sortOrder, 10);
		}
	};


	/**
	 * Создает заголовок таблицы
	 * @param options Конфиг
	 * @param options.columns Массив с конфигом колонок
	 * @param options.onSort Функция реакции на сортировку
	 * @constructor
	 */
	function TableHeader(options) {
		this.columns = $.isArray(options.columns) ? options.columns : [];
		this.sortOrderIcons = {
			'1': '&uarr;',
			'-1': '&darr;'
		};

		var container = $('<tr></tr>');
		this.container = container;

		if ($.isFunction(options.onSort)) {
			container.on('click', 'th .pseudo', function () {
				var sortIndex = container.find('th').index($(this).closest('th'));

				options.onSort(sortIndex);
			});
		}
	}


	/**
	 * Формирует заголовок таблицы
	 * @param sortIndex Номер колонки, по которой происходит сортировка
	 * @param sortOrder Направление сортировки
	 */
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

		this.container.get(0).innerHTML = html;
	};


	/**
	 * Создает строку таблицы
	 * @param columns Массив с конфигом колонок
	 * @param data Массив с данными ячеек
	 * @constructor
	 */
	function TableRow(columns, data) {
		this.data = data;
		this.cells = [];

		for (var i = 0, l = this.data.length; i < l; i++) {
			this.cells.push(this.createCell(this.data[i], columns[i].type));
		}
	}


	/**
	 * Создает ячейку нужного типа
	 * @param value Значение ячейки
	 * @param type Тип ячейки
	 */
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


	/**
	 * Создает ячейку таблицы (общего типа)
	 * @param value Значение ячейки
	 * @constructor
	 */
	function TableCell(value) {
		// простейший поиск ссылок: конец ссылки определяется пробелом или концом строки
		this.displayValue = value.replace(/(https?:\/\/.*?)(\s|$)/, '<a href="$1" target="_blank">$1</a>$2');
	}



	TableCell.prototype.render = function () {
		return '<td' + (this.cellClass ? ' class="' + this.cellClass + '"' : '') + '>' + this.displayValue + '</td>';
	};



	function TableNumberCell(value) {
		this.displayValue = Math.round(value);
		this.cellClass = 'cell_type_number';
		if (this.displayValue > 0) {
			this.cellClass += ' cell_positive_yes';
		}
		if (this.displayValue < 0) {
			this.cellClass += ' cell_positive_no';
		}
		this.displayValue = (this.displayValue + '').replace('-', '&minus;');
	}

	extendClass(TableNumberCell, TableCell);



	function TableBooleanCell(value) {
		this.displayValue = value ? 'Да' : 'Нет';
	}

	extendClass(TableBooleanCell, TableCell);



	function LoadingIndicator() {
		this.element = $('.loading-indicator').hide();
	}


	LoadingIndicator.prototype.show = function () {
		this.element.show();
	};


	LoadingIndicator.prototype.hide = function () {
		this.element.hide();
	};


	function extendClass(subClass, superClass) {
		var F = function() {};
		F.prototype = superClass.prototype;
		subClass.prototype = new F();
		subClass.prototype.constructor = subClass;
	}


	init();
});
