function filterButtonFunction() {
	var table = document.getElementById("speciesTable");
	var rows = table.getElementsByTagName("tr");
	var items = new Array();
	for (i = 1; i <= rows.length - 1; i++) {
		var currentRow = table.rows[i];
		var sciname = currentRow.getElementsByTagName("td")[1].innerHTML;
		items.push(sciname);
	}
	var filterString = items.toString();
	var selectedItems = filterString.split(",");
	featStore.clearFilter();
	featStore.filterBy(function(record, id) {
		return Ext.Array.indexOf(selectedItems, record.get("sciname")) !== -1;
	}, this);
	mapFilter = "'" + items.join("','") + "'";
} 

/**
The following filter panel code is based on information found at 
https://www.sencha.com/forum/showthread.php?59137-Flexible-multi-line-Grid-Dataview-whatever-filtering
*/
		
Ext.BLANK_IMAGE_URL = 'http://extjs.cachefly.net/ext-3.2.0/resources/images/default/s.gif'; 
Ext.override(Ext.Element, {
    getDistanceTo: function(x, y) {
        var b = this.getBox();
        if (y > b.bottom) {
            y = b.y - (y - b.bottom);
        }
        if (x > b.right) {
            x = b.x - (x - b.right);
        }
        if (x > b.x) {
            return b.y - y;
        }
        if (y > b.y) {
            return b.x - x;
        }
        return Math.round(Math.sqrt(Math.pow(b.y - y, 2) + Math.pow(b.x - x, 2)));
    }
});

/**
 * @class Ext.ux.ProximityFader
 * Manages visibility of a Component based on the proximity of the mouse to a configured trigger Element:<pre><code>
new Ext.ux.ProximityFader({
    threshold: 100,                    // When within 100 pixels of
    trigger: proximityTriggerEl,    // this Element,
    component: myFloatingPanel        // Begin fading in this Component.
});
 */
//Ext.ux.ProximityFader = Ext.extend(Object, {
Ext.ux.ProximityFader = Ext.define('myObject', {
	extend: 'Ext.window.Window',
    constructor: function(config) {
        Ext.apply(this, config);
        if (this.component) {
            this.init(this.component);
        }
    },

    init: function(component) {
        this.component = component;
        if (component.rendered) {
            this.onComponentRender(component);
        } else {
            component.on({
                render: this.onComponentRender,
                single: true,
                scope: this,
                delay: 1
            });
        }
        component.on({
            beforemove: this.onBeforeComponentMove,
            move: this.onComponentMove,
            scope: this
        });

//      If we have not been configured with a trigger
        if (!this.trigger) {
            component.on({
                show: this.onShow,
                hide: this.onHide,
                scope: this
            });
        }
    },

    onBeforeComponentMove: function() {
        if (this.locked) {
            this.ignoreMove = true;
        } else {
            this.lock();
        }
    },

    onComponentMove: function() {
        if (this.ignoreMove) {
            delete this.ignoreMove;
        } else {
            this.unlock();
        }
    },

    lock: function() {
        this.locked = true;
        this.component.show();
        this.el.setOpacity(1);
    },

    unlock: function() {
        this.locked = false;
    },

    onMouseMove: function(e) {

        if (this.locked) return;

        var o = 1, d = this.el.getDistanceTo.apply(this.trigger, e.getXY());
        if (d > this.threshold) {
            this.component.hide();
        } else if (d > 0) {

//          Mouse is within range of the trigger, so show the Component if its not already visible
            if (this.trigger && !this.component.isVisible()) {
                this.component.show();
            }
            var o = 1 - (d / this.threshold);
        }
        this.el.setOpacity(o);
        if (this.shadow) {
            this.shadow.setOpacity(o);
        }
    },

    onComponentRender: function(c) {
        if (!this.trigger) {
            this.trigger = c.el;
        }
        this.el = c.el;
        if (this.el.shadow) {
            this.shadow = this.el.shadow.el;
        }
    },

    onShow: function() {
        if (this.locked) return;
        Ext.getDoc().on('mousemove', this.onMouseMove, this);
    },

    onHide: function() {
        if (this.locked) return;
        Ext.getDoc().un('mousemove', this.onMouseMove, this);
    }
});

Ext.override(String, {
    startsWith: function(prefix) {
        return this.substr(0, prefix.length) == prefix;
    },
    
    endsWith: function(suffix) {
        var start = this.length - suffix.length;
        return (start > -1) && (this.substr(start) == suffix);
    }
});

Ext.ux.FilterCondition = Ext.define('myObject', {
	extend: 'Ext.Container',
    layout: {
        type: 'hbox'
    },
    defaults: {
        margins: '0 2 4 2'
    },
 
    cls: 'x-filter-condition',
 
    Field: Ext.data.Record.create(['name', 'type']),

    filterTestStore: function(testRec) {
    
        var types = Ext.data.Types,
            f = this.fieldCombo,
            idx = f.store.find(f.valueField, f.getValue());

//      A Field is selected, so we can filter the test types available
        if (idx != -1) {
		var fieldType = f.store.getAt(idx).data.type,
                inc = testRec.data.include,
                exc = testRec.data.exclude;

		if (fieldType == types.AUTO) {
                return true;
            }

//          Explicitly including data types mean *ONLY* include those types
            if (inc) {
                return inc.hasOwnProperty(fieldType.type);
            }

//          If a type is excluded, return false
            if (exc && exc.hasOwnProperty(fieldType.type)) {
                return false;
            }
            
//          Default to including a test.
            return true;
        }
    },
 
    initComponent: function() {

		this.testStore = Ext.create('Ext.data.Store', {
			fields: ['test', 'include', 'exclude'],
			data: [
				{test: '<', include: null, exclude: {boolean: true} },
				{test: '<=', include: null, exclude: {boolean: true} },
				{test: '=', include: null, exclude: null },
				{test: '!=', include: null, exclude: null },
				{test: '>=', include: null, exclude: {boolean: true} },
				{test: '>', include: null, exclude: {boolean: true} },
				{test: 'Starts with', include: {string: true}, exclude: null },
				{test: 'Ends with', include: {string: true}, exclude: null },
				{test: 'Contains', include: {string: true}, exclude: null }
			]		
		});

//      Bit flag to indicate when all fields have actually been set to something so that autoApply filters
//      Don't get applied before the user has actually set them up.
        this.fieldsChanged = 0;

//      Create a Store containing the field names and types
//      in the passed Store.

		this.fieldStore = Ext.create('Ext.data.Store', {
			fields: ['name', 'displayName', 'type', 'dateFormat'],
			data: [
				{name: 'comname', displayName: 'Common Name', type: null},
				{name: 'sciname', displayName: 'Scientific Name', type: null},
				{name: 'listing_st', displayName: 'Status', type: null},
				{name: 'type', displayName: 'Species Type', type: null},
				{name: 'group_', displayName: 'Species Group', type: null},
				{name: 'family', displayName: 'Species Family', type: null},
				{name: 'list_date', displayName: 'Date Listed', type: null}
			]
		});
 
//      Create a Combo which allows selection of a field
		this.fieldCombo = Ext.create('Ext.form.ComboBox', {	
            triggerAction: 'all',
            store: this.fieldStore,
            valueField: 'name',
            displayField: 'displayName',
            editable: false,
            forceSelection: true,
            mode: 'local',
			padding: '0 0 0 20',
            listeners: {
                select: this.onFieldSelect,
                scope: this
            }
        });
 
//      Create a Combo which allows selection of a test
		this.testCombo = Ext.create('Ext.form.ComboBox', {
            width: 100,
            editable: false,
            forceSelection: true,
            valueField: 'test',
            displayField: 'test',
            mode: 'local',
            store: this.testStore,
			padding: '0 0 0 20',
            listeners: {
                select: this.onTestSelect,
                scope: this
            }
        });

//      Inputs for each type of field. Hidden and shown as necessary
        this.booleanInput = new Ext.form.Checkbox({
            hidden: true,
            testFilter: function(rec) {
                var t = rec.text;
                return (t == '=') || (t == '!=');
            },
            listeners: {
                check: this.onTestValueChange,
                scope: this
            }
        });
        this.intInput = new Ext.form.NumberField({
            allowDecimals: false,
            hidden: true,
            listeners: {
                valid: this.onTestValueChange,
                scope: this
            }
        });
        this.floatInput = new Ext.form.NumberField({
            hidden: true,
            listeners: {
                valid: this.onTestValueChange,
                scope: this
            }
        });
        this.textInput = new Ext.form.TextField({
            hidden: true,
            enableKeyEvents: true,
			padding: '0 0 0 20',
            listeners: {
                keypress: {
                    fn: this.onTestValueChange,
                    buffer: 50
                },
                change: this.onTestValueChange,
                scope: this
            }
        });
        this.dateInput = new Ext.form.DateField({
            hidden: true,
            convertValue: function(d) {
                return d.valueOf();
            },
            listeners: {
                select: this.onTestValueChange,
                valid: this.onTestValueChange,
                scope: this
            }
        });
 
        this.cls = 'x-filter-condition';
        this.items = [
		{
            xtype: 'button',
            margins: '0 2 0 0',
            iconCls: 'delete-button',
            handler: this.removeSelf,
            scope: this,
            tooltip: 'Remove this condition'
        }, 
			this.fieldCombo, this.testCombo, this.booleanInput, this.intInput, this.floatInput, this.textInput, this.dateInput
		];
        Ext.ux.FilterCondition.superclass.initComponent.apply(this, arguments);
    },

    removeSelf: function() {
        var o = this.ownerCt;
        o.remove(this, true);
    },

    toggleEnabled: function(b) {
        b = Ext.get(b.el.query(b.buttonSelector));
        if (this.disabled) {
            b.removeClass('condition-row-disabled');
            b.addClass('condition-row-enabled');
            this.enable();
        } else {
            b.removeClass('condition-row-enabled');
            b.addClass('condition-row-disabled');
            this.disable();
        }
    },

    focus: function() {
        this.fieldCombo.focus();
    },

    onDisable: function() {
        for (var i = 0, it = this.items.items, l = it.length; i < l; i++) {
            if (!(it[i] instanceof Ext.Button)) {
                it[i].disable();
            }
        }
        this.disabled = true;
        this.fireChangeEvent();
    },
 
    onEnable: function() {
        for (var i = 0, it = this.items.items, l = it.length; i < l; i++) {
            it[i].enable();
        }
        this.disabled = false;
        this.fireChangeEvent();
    },

    onFieldSelect: function(combo, rec, index) {
//      Refresh the tests dropdown
        this.testStore.fireEvent('datachanged', this.fieldStore);

        var types = Ext.data.Types;
        this.booleanInput.hide();
        this.intInput.hide();
        this.floatInput.hide();
        this.textInput.hide();
        this.dateInput.hide();
        this.textInput.show();
        this.valueInput = this.textInput;
        this.fieldsChanged |= 1;
        this.fireChangeEvent();
    },
 
    onTestSelect: function(combo, rec, index) {
        this.fieldsChanged |= 2;
        this.fireChangeEvent();
        if (rec.get("test") == "Between") {
        	if (this.valueInput) {
	            this.secondValueInput = this.valueInput.cloneConfig();
	            this.add(this.secondValueInput);
	            this.secondValueInput.show();
	        }
        } else {
            if (this.secondValueInput) {
                this.remove(this.secondValueInput);
                delete this.secondValueInput;
            }
        }
    },

    onTestValueChange: function() {
        this.fieldsChanged |= 4;
        this.fireChangeEvent();
    },

//  Only fire the change event if it's an actually applied filter.
//  During first run through, the change event should not fire.
    fireChangeEvent: function() {
        if (this.fieldsChanged == 7) {
            this.fireEvent("change", this);
        }
    },

    getValue: function() {
        return {
            field: this.fieldCombo.getValue(),
            test: this.testCombo.getValue(),
            value: this.valueInput.getValue()
        };
    },

    getXml: function() {
        if (!this.testCombo || !this.testCombo.getValue() || !this.valueInput) {
            return '';
        }
        return '<condition test="' + this.testCombo.getValue() + '">\n' +
            '  <field>' + this.fieldCombo.getValue() + '</field>\n' +
            '  <value>' + this.valueInput.getRawValue() + '</value>\n' +
        '</condition>';
    },

    getFilterFunction: function() {
        if (!this.filterFunction) {
			this.filterFunction = this.filterFunctionImpl.bind(this);
        }
        return this.filterFunction;
    },

    filterFunctionImpl: function(rec) {
        var fieldValue = rec.get(this.fieldCombo.getValue()),
            v = this.valueInput.getValue(),
            v1 = this.secondValueInput ? this.secondValueInput.getValue() : null;

//      If the field knows how to preprocess...
        if (this.valueInput.convertValue) {
            fieldValue = this.valueInput.convertValue(fieldValue);
            v = this.valueInput.convertValue(v);
            v1 = this.valueInput.convertValue(v1);
        }

        switch (this.testCombo.getValue()) {
            case '<':
                return fieldValue < v;

            case '<=':
                return fieldValue <= v;

            case '=':
                return fieldValue == v;

            case '!=':
                return fieldValue != v;

            case '>=':
                return fieldValue >= v;

            case '>':
                return fieldValue > v;
                
            case 'Starts with':
                return (Ext.isString(fieldValue) && fieldValue.startsWith(v));

            case 'Ends with':
                return (Ext.isString(fieldValue) && fieldValue.endsWith(v));

            case 'Contains':
                return (Ext.isString(fieldValue) && (fieldValue.indexOf(v) !== -1));
        
            case 'Between':
                return (fieldValue >= v) && (fieldValue <= v1);
        
        }
    },

    isEmpty: function() {
        return ((this.fieldCombo.getValue.length == 0) && (this.testCombo.getValue().length == 0)) || !this.valueInput;
    }
});

Ext.ux.StoreFilter = Ext.extend(Ext.Panel, {
    constructor: function(config) {
        config = Ext.apply({}, {
            layout: 'anchor',
            bodyStyle: {
                padding: '10px 0px 10px 10px',
                overflow: 'auto'
            },
            defaults: {
                xtype: 'container',
                autoEl: {}
            },
            items: [{
                cls: 'x-condition-header',
                anchor: '-25',
                layout: 'column',
                style: {
                    'text-decoration': 'underline',
                    'font': 'bold small verdana',
                    'margin-bottom': '5px'
                },
                defaults: {
                    xtype: 'box',
                    style: {
                        'padding-left': '5px'
                    }
                },
                items: [{
                    style: {
                        'padding-left': '55px'
                    },
					width: 500,
					autoEl: {html: 'Filter Column &nbsp&nbsp&nbsp&nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp' +
								   'Filter Type &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp ' +
								   'Filter Value'}
                }]
            }, this.addConditionButton = new Ext.Button({
                iconCls: 'add-button',
                handler: this.onAddConditionButtonClick,
                scope: this,
                tooltip: 'Add condition'
            })],
			bbar: [
				{xtype: 'button', text: 'Clear Filter', handler: this.clearFilter}
			]
        }, config);
        Ext.ux.StoreFilter.superclass.constructor.call(this, config);
    },

    onAddConditionButtonClick: function() {
		var c, j = this.items.getCount();
        if (j > 2) {
            c = this.items.items[j - 2];
            if (c.isEmpty()) {
                return;
            }
        }
        c = new Ext.ux.FilterCondition({store: this.store});
        if (this.autoApply) {
            c.on({
                change: this.doFilter,
                destroy: this.doFilter,
                scope: this
            })
        }
        this.insert(this.items.getCount() - 1, c);
        this.addConditionButton.getEl().scrollIntoView(this.body);
        c.focus();
    },

    doFilter: function() {
        this.store.filterBy(this.getFilterFunction());
    },

    clearFilter: function() {
		featStore.clearFilter();
    },

    getFilterFunction: function() {
        if (!this.filterFunction) {
			this.filterFunction = this.filterFunctionImpl.bind(this);
        }
        return this.filterFunction;
    },

    filterFunctionImpl: function(rec) {
        for (var i = 0, it = this.items.items, l = it.length; i < l; i++) {
            var c = it[i];
            if ((c instanceof Ext.ux.FilterCondition) && (!c.isEmpty()) && (!c.disabled)) {
                var fn = c.getFilterFunction();
                if (!fn(rec)) {
                    return false;
                }
            }
        }
        return true;
    }
});