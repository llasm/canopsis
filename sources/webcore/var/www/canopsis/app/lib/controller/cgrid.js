/*
#--------------------------------
# Copyright (c) 2011 "Capensis" [http://www.capensis.com]
#
# This file is part of Canopsis.
#
# Canopsis is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Canopsis is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with Canopsis.  If not, see <http://www.gnu.org/licenses/>.
# ---------------------------------
*/
Ext.define('canopsis.lib.controller.cgrid', {
	extend: 'Ext.app.Controller',

	allowEdit: true,

	EditMethod: 'window',

	checkInternal: false,

	logAuthor: '[controller][cgrid]',

	init: function() {
		log.debug('Initialize ' + this.id + ' ...', this.logAuthor);

		var control = {};
		control[this.listXtype] = {
			afterrender: this._bindGridEvents
		};
		this.control(control);

		this.callParent(arguments);

	},

	_bindGridEvents: function(grid) {
		var id = grid.id;
		this.grid = grid;

		log.debug('Bind events "' + id + '" ...', this.logAuthor);

		grid.on('select', this._select,	this);

		//Bind Dblclick
		grid.on('selectionchange',	this._selectionchange,	this);
		if (grid.opt_view_element) {
			grid.on('itemdblclick', this._viewElement, this);
		}
		else {
			if (grid.opt_allow_edit == true)
				grid.on('itemdblclick', this._editRecord, this);
		}

		//Binding action for contextMenu
		if (grid.contextMenu) {
			grid.on('itemcontextmenu', this._contextMenu, this);

			//Duplicate button
			var btns = Ext.ComponentQuery.query('#' + grid.contextMenu.id + ' [action=duplicate]');
			for (var i = 0; i < btns.length; i++)
				btns[i].on('click', this._duplicateRecord, this);

			//DeleteButton
			var btns = Ext.ComponentQuery.query('#' + grid.contextMenu.id + ' [action=delete]');
			for (var i = 0; i < btns.length; i++)
				btns[i].on('click', this._deleteButton, this);

			//edit rights
			var btns = Ext.ComponentQuery.query('#' + grid.contextMenu.id + ' [action=rights]');
			for (var i = 0; i < btns.length; i++)
				btns[i].on('click', this._editRights, this);

			//Rename option
			var btns = Ext.ComponentQuery.query('#' + grid.contextMenu.id + ' [action=rename]');
			for (var i = 0; i < btns.length; i++)
				btns[i].on('click', this._rename, this);

			//send by mail
			var btns = Ext.ComponentQuery.query('#' + grid.contextMenu.id + ' [action=sendByMail]');
			for (var i = 0; i < btns.length; i++)
				btns[i].on('click', this._sendByMail, this);

			//authKey
			var btns = Ext.ComponentQuery.query('#' + grid.contextMenu.id + ' [action=authkey]');
			for (var i = 0; i < btns.length; i++)
				btns[i].on('click', this._authkey, this);

			// Set Avatar
			var btns = Ext.ComponentQuery.query('#' + grid.contextMenu.id + ' [action=setAvatar]');
			for (var i = 0; i < btns.length; i++)
				btns[i].on('click', this._setAvatar, this);

			//run
			var btns = Ext.ComponentQuery.query('#' + grid.contextMenu.id + ' [action=run]');
			for (var i = 0; i < btns.length; i++)
				btns[i].on('click', this._runItem, this);

			//enable / disable button
			var btns = Ext.ComponentQuery.query('#' + grid.contextMenu.id + ' [action=enable-disable]');
			for (var i = 0; i < btns.length; i++)
				btns[i].on('click', this._enabledisable, this);

		}
		//search buttons
		var btns = Ext.ComponentQuery.query('#' + id + ' button[action=search]');
		for (var i = 0; i < btns.length; i++) {
			if (this.grid.opt_bar_time_search) {
				btns[i].on('click', this.timeDisplay, this);
			}else {
				if (this.grid.opt_simple_search == true) {
					btns[i].on('click', this._searchRecordSimple, this);
				}else {
					btns[i].on('click', this._searchRecord, this);
				}
			}
		}

		var btns = Ext.ComponentQuery.query('#' + id + ' button[action=clean_search]');
		for (var i = 0; i < btns.length; i++) {
			btns[i].on('click', function() {
				this.grid.down('textfield[name=searchField]').setValue('');
				this._searchRecord();
			},this);
		}

		//bind keynav
		var textfields = Ext.ComponentQuery.query('#' + id + ' textfield[name=searchField]');
		var keynav_config = {
				scope: this,
				enter: (this.grid.opt_simple_search == true) ? this._searchRecordSimple : this._searchRecord
			};

		for (var i = 0; i < textfields.length; i++) {
				var textfield = textfields[i];

				//HACK : because sometimes this field is really long to render
				if (!textfield.el) {
					textfield.on('afterrender', function() {
						new Ext.util.KeyNav(textfield.id, keynav_config);
					},this);
				}else {
					new Ext.util.KeyNav(textfield.id, keynav_config);
				}
		}

		if (grid.opt_keynav_del) {
			//log.debug('id of grid is : ' + id);
			var inner_view = this.grid.getView();
			this._keynav = Ext.create('Ext.util.KeyNav', inner_view, {
						scope: this,
						del: this._deleteButton,
						target: inner_view.id
			});
		}

		//Duplicate buttons
		var btns = Ext.ComponentQuery.query('#' + id + ' button[action=duplicate]');
		for (var i = 0; i < btns.length; i++)
			btns[i].on('click', this._duplicateRecord, this);

		// Add buttons
		var btns = Ext.ComponentQuery.query('#' + id + ' button[action=add]');
		for (var i = 0; i < btns.length; i++)
			btns[i].on('click', this._addButton, this);

		// Delete buttons
		var btns = Ext.ComponentQuery.query('#' + id + ' button[action=delete]');
		for (var i = 0; i < btns.length; i++)
			btns[i].on('click', this._deleteButton, this);

		// Reload buttons
		var btns = Ext.ComponentQuery.query('#' + id + ' button[action=reload]');
		for (var i = 0; i < btns.length; i++)
			btns[i].on('click', this._reloadButton, this);

		// Download buttons
		var btns = Ext.ComponentQuery.query('#' + id + ' button[action=download]');
		for (var i = 0; i < btns.length; i++)
			btns[i].on('click', this._downloadButton, this);

		// TimeDisplaybutton
		/*var btns = Ext.ComponentQuery.query('#' + id + ' button[action=timeDisplay]');
		for (var i = 0; i < btns.length; i ++)
			btns[i].on('click', this.timeDisplay, this);
		*/

		var field = Ext.ComponentQuery.query('#' + id + ' cdate[name=startTimeSearch]');
		for (var i = 0; i < field.length; i++)
			field[i].on('select', this.setMaxDate, this);

		var field = Ext.ComponentQuery.query('#' + id + ' cdate[name=endTimeSearch]');
		for (var i = 0; i < field.length; i++)
			field[i].on('select', this.setMinDate, this);

		//this._reloadButton(grid)

	},

	_bindFormEvents: function(form) {
		var id = form.id;
		log.debug('[controller][cgrid][form] - Bind events on "' + id + '" ...');

		// Save buttons
		var btns = Ext.ComponentQuery.query('#' + id + ' button[action=save]');
		for (var i = 0; i < btns.length; i++)
			btns[i].on('click', function() { this._saveForm(form) }, this);

		// Cancel buttons
		var btns = Ext.ComponentQuery.query('#' + id + ' button[action=cancel]');
		for (var i = 0; i < btns.length; i++)
			btns[i].on('click', function() { this._cancelForm(form) }, this);
	},

	_reloadButton: function() {
		log.debug('Reload store "' + this.grid.store.storeId + '" of ' + this.grid.id, this.logAuthor);
		log.debug('store.proxy.extraParams.filter:', this.logAuthor);
		log.dump(this.grid.store.proxy.extraParams.filter);
		this.grid.store.load();
	},

	_select: function(record, index, eOpts) {
		log.debug('select', this.logAuthor);

		if (this.grid.opt_tags_search) {
			// Filter on tags
			var selected_tags = [];
			try {
				selected_tags = Ext.get(this.grid.getView().getNode(index)).query('ul[class=tags] > li:hover > a');
			} catch (err) {
				selected_tags = [];
			}

			if (selected_tags.length > 0) {
				var tag = Ext.get(selected_tags[0]).getHTML();
				var search = this.grid.down('textfield[name=searchField]');
				if (search && tag) {
					search.setValue('"#' + tag + '"');
					this._searchRecord();
				}
			}else {
				log.debug('No tags selected', this.logAuthor);
			}
		}
	},

	_selectionchange: function(view, records) {
		log.debug('selectionchange', this.logAuthor);
		var grid = this.grid;

		//Enable delete Button
		btns = Ext.ComponentQuery.query('#' + grid.id + ' button[action=delete]');
		for (var i = 0; i < btns.length; i++)
			btns[i].setDisabled(records.length === 0);

		//Enable duplicate Button
		btns = Ext.ComponentQuery.query('#' + grid.id + ' button[action=duplicate]');
		for (var i = 0; i < btns.length; i++)
			btns[i].setDisabled(records.length === 0);

		if (this.selectionchange)
			this.selectionchange(view, records);

	},

	_viewElement: function(view, item, index) {
		log.debug('Clicked on element, function viewElement', this.logAuthor);
		//add_view_tab(this.grid.opt_view_element, item.data.component, true, {'nodeId' : item.data._id}, true, true,item.data.component)
	},

	_deleteButton: function(button) {
		log.debug('Clicked deleteButton', this.logAuthor);
		var grid = this.grid;
		var me = this;

		var selection = grid.getSelectionModel().getSelection();
		if (selection) {

			//check right
			var ctrlAccount = this.getController('Account');
			var authorized = true;

			for (var i = 0; i < selection.length; i++) {
				if (!ctrlAccount.check_record_right(selection[i], 'w'))
					authorized = false;

				if (this.checkInternal && selection[i].get('internal'))
					authorized = false;

				if (! authorized)
					break;
			}

			if (authorized == true) {
				Ext.MessageBox.confirm(_('Confirm'), _('Are you sure you want to delete') + ' ' + selection.length + ' ' + _('items') + ' ?',
					function(btn, text) {
						if (btn == 'yes') {
							log.debug('Remove records', me.logAuthor);
							grid.store.remove(selection);
						}
					});
			} else {
				global.notify.notify(_('Access denied'), _('You don\'t have the rights to modify this object'), 'error');
			}
		}

		if (this.deleteButton)
			this.deleteButton(button, grid, selection);

	},

	_enabledisable: function() {
		log.debug('Clicked enabledisable Button', this.logAuthor);
		var grid = this.grid;

		this.grid.store.suspendAutoSync()

		var selection = grid.getSelectionModel().getSelection();
		for(var i = 0; i < selection.length; i++){
			var record = selection[i]
			record.suspendEvents()
			if (record.get('enable'))
				record.set('enable', false);
			else
				record.set('enable', true);
			record.resumeEvents()
		}

		this.grid.store.resumeAutoSync()
		this.grid.store.sync()
	},

	_editRights: function() {
		//log.debug('Edit rights',this.logAuthor);
		var grid = this.grid;
		var selection = grid.getSelectionModel().getSelection()[0];
		//create form
		if (this.getController('Account').check_record_right(selection, 'w')) {
			var config = {
				data: selection,
				namespace: this.grid.opt_db_namespace,
				renderTo: grid.id,
				constrain: true
			};
			crights = Ext.create('canopsis.lib.view.crights', config);
			//listen to save event to refresh store
			crights.on('save', function() {grid.store.load()},this);
			crights.show();
		} else {
			global.notify.notify(_('Access denied'), _('You don\'t have the rights to modify this object'), 'error');
		}
	},

	_addButton: function(button) {
		log.debug('Clicked addButton', this.logAuthor);

		this._showForm();

		if (this.addButton)
			this.addButton(button);
	},

	_saveForm: function(form,store) {
		log.debug('Clicked saveForm', this.logAuthor);

		if (store == undefined) {
			if (form.store)
				var store = form.store;
			else
				var store = this.grid.store;
		}

		if (form.form.isValid()) {
			var data = form.getValues();
			if (form.editing) {
				var record = form._record;
				record.beginEdit();

				//HACK anti set value crash, model doesn't accept unknown value
				//and will crash
				var cleaned_data = {};
				Ext.Object.each(data, function(key, value, myself) {
					if (Ext.Array.contains(record.fields.keys, key))
						cleaned_data[key] = value;
				});

				record.set(cleaned_data);
			}else {
				var record = Ext.create('canopsis.model.' + this.modelId, data);
				record.beginEdit();
			}

			record = this._preSave(record, data, form);
			record.endEdit(true);

			this._validateForm(store, data, form, record);

		}else {
			log.error('Form is not valid !', this.logAuthor);
			global.notify.notify(_('Invalid form'), _('Please check your form'), 'error');
			return;
		}

	},

	_save: function(record,edit,store,form) {
		if (!store)
			store = this.grid.store;
		if (!form)
			form = this.current_form;

		if (edit)
			var batch = store.proxy.batch({update: [record]});
		else
			var batch = store.proxy.batch({create: [record]});

		batch.on('complete', function(batch,operation,opts) {
			this.displaySuccess(batch, operation, opts);
			log.debug('Reload store', this.logAuthor);
			this.load();
		},store);

		this._postSave(record);
		this._cancelForm(form);
	},

	_validateForm: function(store, data, form, record) {
		var valid = true;
		if (this.validateForm)
			valid = this.validateForm(store, data, form.form);

		if (valid) {
			if (this.ajaxValidation)
				this.ajaxValidation(record, form.form.editing);
			else
				this._save(record, form.editing, store, form);
		}else {
			log.error('Form is not valid !', this.logAuthor);
			global.notify.notify(_('Invalid form'), _('Please check your form'), 'error');
		}
	},

	_preSave: function(record,data,form) {
		log.debug('Pre-Save', this.logAuthor);
		if (this.preSave) {
			return this.preSave(record, data, form);
		}else {
			return record;
		}
	},

	_postSave: function(record) {
		log.debug('Post-Save', this.logAuthor);
		if (this.postSave) {
			return this.postSave(record);
		}else {
			return record;
		}
	},

	_cancelForm: function(form) {
		log.debug('clicked cancelForm', this.logAuthor);
		if (this.formXtype) {
			var id = form.id;
			log.debug(" Close '" + id + "'", this.logAuthor);

			if (form.win) {
				form.win.close();
				if (this._keynav)
					this._keynav.enable();
			}else {
				form.close();
			}
		}

		if (this.cancelForm) {
			this.cancelForm(form);
		}
	},

	_showForm: function(item) {
		log.debug('Show form', this.logAuthor);

		if (this.showForm)
			return this.showForm(item);

		var id = undefined;
		var data = undefined;
		var editing = false;

		// Edit
		if (item) {
			id = this.formXtype + '-' + item.internalId.replace(/[\. ]/g, '-') + '-form';
			data = item.data;
			editing = true;
		}

		var form;

		if (this.formXtype) {
			if (this.EditMethod == 'tab') {

				var main_tabs = Ext.getCmp('main-tabs');
				var tab = Ext.getCmp(id);
				if (tab) {
					// Active TAB
					log.debug("Tab '" + id + "' allready open, just show it", this.logAuthor);
					main_tabs.setActiveTab(tab);
					return undefined;
				}else {
					// Create new TAB
					log.debug("Create tab '" + this.formXtype + "'", this.logAuthor);

					if (editing)
						var title = _('Editing ') + data.crecord_name;
					else
						var title = '*' + _('New') + ' ' + this.modelId;

					form = main_tabs.add({
						id: id,
						title: title,
						xtype: this.formXtype,
						EditMethod: this.EditMethod,
						editing: editing,
						record: data,
						_record: item,
						closable: true
					}).show();
					form.win = undefined;

					this._keynav.disable();
					this.current_form = form;
				}

			}else {
				form = Ext.getCmp(id);

				if (form) {
					log.debug("Window '" + id + "' allready open, just show it", this.logAuthor);
					form.win.show();
					return form;
				}else {
					// Create new Window
					log.debug("Create window '" + this.formXtype + "'", this.logAuthor);
					var form = Ext.create('widget.' + this.formXtype, {
						id: id,
						EditMethod: this.EditMethod,
						editing: editing,
						record: data,
						_record: item
					});

					if (this.getEditTitle)
						var title = this.getEditTitle(item);
					else
						var title = _(this.modelId);

					var win = Ext.create('widget.window', {
						title: title,
						items:[form],
						closable: true,
						resizable: false,
						constrain: true,
						renderTo: this.grid.id,
						closeAction: 'destroy'
					}).show();
					form.win = win;

					this.grid.window_form = win;

					this._keynav.disable();
					this.current_form = form;
				}
			}

			this._bindFormEvents(form);
			return form;
		}
	},

	_sendByMail: function() {
		log.debug('Clicked sendByMail', this.logAuthor);
		var grid = this.grid;
		var item = grid.getSelectionModel().getSelection()[0];
		if (this.sendByMail) 
				this.sendByMail(item);
	},

	_authkey: function() {
		log.debug('Clicked authentification key', this.logAuthor);
		var grid = this.grid;
		var item = grid.getSelectionModel().getSelection()[0];

		var config = {
			account: item.get('user'),
			constrain: true,
			renderTo: grid.id
		};

		var authkey = Ext.create('canopsis.lib.view.cauthkey', config);
		authkey.show();
	},

	_setAvatar: function(view, item, index) {
		var grid = this.grid;
		var item = grid.getSelectionModel().getSelection()[0];
		var filename = item.data.file_name;
		var file_id = item.data._id;
		
		global.accountCtrl.setAvatar(file_id, filename);
	},

	_runItem: function() {
		log.debug('Clicked runItem', this.logAuthor);
		var grid = this.grid;
		var item = grid.getSelectionModel().getSelection()[0];
		if (this.runItem) {
			this.runItem(item);
		}
	},


	_rename: function(view, item, index) {
		log.debug('Clicked rename', this.logAuthor);
		var grid = this.grid;
		var item = grid.getSelectionModel().getSelection()[0];

		//check rights
		var ctrl = this.getController('Account');
		if (ctrl.check_record_right(item, 'w')) {
			if (this.rename) {
					this.rename(item);
			}
		} else {
			global.notify.notify(_('Access denied'), _('You don\'t have the rights to modify this object'), 'error');
		}
	},

	_editRecord: function(view, record, item, index, e, eOpts, store) {
		log.debug('Clicked editRecord', this.logAuthor);

		//hack create a copy to not mess with old record
		var record_copy = record.copy();
		Ext.data.Model.id(record_copy);

		//check rights
		var ctrl = this.getController('Account');
		if (ctrl.check_record_right(record, 'w')) {
			var form = this._showForm(record, store);

			if (form) {
				if (this.beforeload_EditForm)
					this.beforeload_EditForm(form, record_copy);

				form.loadRecord(record_copy);

				if (this.afterload_EditForm)
					this.afterload_EditForm(form, record_copy);
			}

			if (this.editRecord)
				this.editRecord(view, record_copy, index);
		} else {
			global.notify.notify(_('Access denied'), _('You don\'t have the rights to modify this object'), 'error');
		}
	},

	_contextMenu: function(view, rec, node, index, e) {
		//don't auto select if multi selecting
		var selection = this.grid.getSelectionModel().getSelection();
		if (selection.length < 2)
			view.select(rec);

		this.grid.contextMenu.showAt(e.getXY());
		return false;
    },

	_duplicateRecord: function() {
		log.debug('clicked duplicateRecord', this.logAuthor);
		var grid = this.grid;
		var item = grid.getSelectionModel().getSelection()[0];
		if (item) {
			var editing = false;

			if (this.formXtype) {
				if (this.EditMethod == 'tab') {
					var main_tabs = Ext.getCmp('main-tabs');
					var id = this.formXtype + '-' + item.internalId.replace(/[\. ]/g, '-') + '-tab';
					var tab = Ext.getCmp(id);
					if (tab) {
						log.debug("Tab '" + id + "'allerady open, just show it", this.logAuthor);
						main_tabs.setActiveTab(tab);
					}else {
						log.debug("Create tab '" + id + "'", this.logAuthor);
						var form = main_tabs.add({
							title: _('Edit') + ' ' + item.raw.crecord_name,
							xtype: this.formXtype,
							id: id,
							closable: true }).show();
						this.current_form = form;
					}

				}else {
					var form = Ext.getCmp(id);

					if (form) {
						log.debug("Window '" + id + "' allready open, just show it", this.logAuthor);
						form.win.show();
					}else {
						// Create new Window
						log.debug("Create window '" + this.formXtype + "'", this.logAuthor);
						var form = Ext.create('widget.' + this.formXtype, {
							id: id,
							EditMethod: this.EditMethod,
							editing: editing,
							record: item.copy()
						});

						var win = Ext.create('widget.window', {
							title: this.modelId,
							items: form,
							closable: true,
							resizable: false,
							constrain: true,
							renderTo: this.grid.id,
							closeAction: 'destroy'
						}).show();
						form.win = win;
						this._keynav.disable();
						this.current_form = form;
					}
				}

				//duplicate
				var copy = item.copy();
				Ext.data.Model.id(copy);
				copy.set('_id', undefined);

				// load records
				if (this.beforeload_DuplicateForm)
					this.beforeload_DuplicateForm(form, copy);

				form.loadRecord(copy);

				if (this.afterload_DuplicateForm)
					this.afterload_DuplicateForm(form, copy);

				this._bindFormEvents(form);
			}
		}else {
			global.notify.notify(_('Error'), _('You must select record'), 'error');
		}
	},

	_searchRecord: function() {
		log.debug('Clicked on searchButton', this.logAuthor);

		var grid = this.grid;
		var store = grid.getStore();
		var search = grid.down('textfield[name=searchField]').getValue();

		if (this.search_filter_id)
			store.deleteFilter(this.search_filter_id);


		//log.dump(search)
		if (search == '') {
			store.clearFilter();
		}else {
			//create an array and give it to store.search
			var search_filters = [];
			var search_tags = [];

			// Split search string by space
			var search_value_array = split_search_box(search);

			log.debug(' + Search:', this.logAuthor);
			log.dump(search_value_array);

			for (var j = 0; j < search_value_array.length; j++) {
				var search = search_value_array[j];

				// Check if it's a tag
				if (search[0] == '#') {
					search_tags.push(search.slice(1));
				}else {
					var filter = [];
					for (var i = 0; i < grid.opt_bar_search_field.length; i++) {
						var field = grid.opt_bar_search_field[i];
						var sub_filter = {};
						sub_filter[field] = { '$regex' : search, '$options': 'i'};

						filter.push(sub_filter);
					}
					search_filters.push({'$or': filter});
				}

			}

			log.debug(' + search_filters:', this.logAuthor);
			log.dump(search_filters);

			log.debug(' + search_tags:', this.logAuthor);
			log.dump(search_tags);

			search_tags = Ext.Array.unique(search_tags);

			for (var i = 0; i < search_tags.length; i++)
				search_filters.push({ 'tags': search_tags[i] });

			log.debug(' + Final search_filters:', this.logAuthor);
			log.dump(search_filters);

			if (search_filters.length == 0)
				return;
			else if (search_filters.length == 1)
				this.search_filter_id = store.addFilter(search_filters[0]);
			else
				this.search_filter_id = store.addFilter(store.getAndFilter(search_filters));

		}

		if (grid.pagingbar) {
			grid.pagingbar.moveFirst();
		}else {
			store.load();
		}
	},

	//temporary function, will be merge with the previous as soon as possible
	_searchRecordSimple: function() {
		log.debug('Clicked on searchButton (new func)', this.logAuthor);
		var grid = this.grid;
		var store = grid.getStore();
		var search = grid.down('textfield[name=searchField]').getValue();

		store.proxy.extraParams.search = search;

		if (grid.pagingbar) {
			grid.pagingbar.moveFirst();
		}else {
			store.load();
		}
	},

	setMaxDate: function(cdate,date) {
		log.debug('Set max date', this.logAuthor);
		var stop = this.grid.down('cdate[name=endTimeSearch]').setMinDate(date);
	},

	setMinDate: function(cdate,date) {
		log.debug('Set min date', this.logAuthor);
		var stop = this.grid.down('cdate[name=startTimeSearch]').setMaxDate(date);
	},

	timeDisplay: function() {
		var store = this.grid.getStore();
		if (this.filter_id)
			store.deleteFilter(this.filter_id);

		var start = this.grid.down('cdate[name=startTimeSearch]').getValue();
		var stop = this.grid.down('cdate[name=endTimeSearch]').getValue();

		var filter = store.getAndFilter([
										{timestamp: {$gt: start}},
										{timestamp: {$lt: stop}}
										]);
		//log.dump(new Date(start) + ' ' + new Date(stop))
		this.filter_id = store.addFilter(filter);
		this._searchRecord();
	}

});
