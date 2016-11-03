Ext.require([
    'Ext.container.Container',
    'Ext.panel.Panel',
    'Ext.grid.Panel',
    'GeoExt.component.Map',
    'GeoExt.data.store.Features',
    'GeoExt.grid.column.Symbolizer'
]);

// Create a new Ext application
Ext.application({
    name: 'FeatureGrids',
    launch: function() {

		Ext.QuickTips.init();

		/* CREATE LAYERS */
		
		// Specify URL for accessing critical habitat layer
        var cqlFilter = "spcode LIKE '%'";  
		encodedFilter = encodeURIComponent(cqlFilter);
		var crithabTable = 'crithab:all_species_final_nacis_30';
		var crithabUrl = 'http://localhost:8080/geoserver/crithab/ows?service=WFS&' +
				'version=1.0.0&request=GetFeature&typename=' + crithabTable + '&' +
				'outputFormat=application/json&srsname=EPSG:4326&' 
				+ 'CQL_FILTER={{CQLFILTER}}';
		crithabUrl = crithabUrl.replace('{{CQLFILTER}}', encodedFilter);
		
		// Specify the layer source using the URL for accessing a WFS from GeoServer
		var crithabSource = new ol.source.Vector({
			format: new ol.format.GeoJSON(),
			url: function(extent, resolution, projection) {
				return crithabUrl;
			},
			strategy: ol.loadingstrategy.all
		});
		
		// Specify the vector layer using the source object and style function
		var crithabLayer = new ol.layer.Vector({
			source: crithabSource,
			style: styleFunction
		});	
		
		// Create layer for the Stamen Toner-lite basemap
		var stamenTonerLiteLayer = new ol.layer.Tile({
			title: 'Stamen Toner-lite',
			type: 'base',
			visible: true,
			source: new ol.source.Stamen({
				layer: 'toner-lite'
			})
		});
		
		// Create layer for OpenStreetMap basemap
		var osmLayer = new ol.layer.Tile({
			title: 'OpenStreetMap',
			type: 'base',
			visible: false,
			source: new ol.source.OSM()
		});
		
		// Create layer to load Bing imagery basemap
		var bingImageryLayer = new ol.layer.Tile({
			title: 'Imagery with Streets',
			type: 'base',
			visible: false,
			source: new ol.source.BingMaps({
				key: 'Ant01pdycNuSSCqz1VWW4foGlZTKZ3qZgnl8Sv7Fjn6ABNL03-b7B50YOBHAnZCo',
				imagerySet: 'AerialWithLabels'
			})	
		});

		/* FUNCTIONS TO FILTER MAP FEATURES */

		// Filters the features shown on the map to an array of spcode values
		function filterMap(list) {
			var newFilter = "spcode IN (" + list + ")";
			newEncodedFilter = encodeURIComponent(newFilter);
			var filterUrl = 'http://localhost:8080/geoserver/crithab/ows?service=WFS&' +
					'version=1.0.0&request=GetFeature&typename=' + crithabTable + '&' +
					'outputFormat=application/json&srsname=EPSG:4326&' 
					+ 'CQL_FILTER={{CQLFILTER}}';
			filterUrl = filterUrl.replace('{{CQLFILTER}}', newEncodedFilter);
			var filterSource = new ol.source.Vector({
				format: new ol.format.GeoJSON(),
				url: function(extent, resolution, projection) {
					return filterUrl;
				},
				strategy: ol.loadingstrategy.all
			});
			crithabLayer.setSource(filterSource);
		}
		
		// Resets the map to display all features
		function unfilterMap() {
			crithabLayer.setSource(crithabSource);
		}


		/* ADD INITIAL ELEMENTS FOR THE POPUP */
		
		// Elements that make up the popup.
		var container = document.getElementById('popup');
		var content = document.getElementById('popup-content');
		var closer = document.getElementById('popup-closer');
		var popupButton = document.getElementById('popup-button');

		// Create an overlay to anchor the popup to the map.
		var overlay = new ol.Overlay(({
			element: container
		}));

		// Add a click handler to hide the popup.
		closer.onclick = function() {
			overlay.setPosition(undefined);
			closer.blur();
			return false;
		};

		
		/* MAP ELEMENTS */

        // Create the map
		map = new ol.Map({
			layers: [
				new ol.layer.Group({
					'title': 'Base maps',
					layers: [stamenTonerLiteLayer, osmLayer, bingImageryLayer]
				}),
                crithabLayer
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([-114.5, 40]),
                zoom: 3
			}),
			overlays: [overlay]
        });
		
		// Add control to zoom full extent
		var zoomToExtentControl = new ol.control.ZoomToExtent({
			extent: [-12746081, 2265942, -10746081, 6065942],
			tipLabel: 'Zoom to extent'
		});
		map.addControl(zoomToExtentControl);
		
		// Add control to switch basemap
		var layerSwitcher = new ol.control.LayerSwitcher({
			tipLabel: 'Légende' // Optional label for button
		});
		map.addControl(layerSwitcher);

		/* STYLE SETTINGS FOR MAP FEATURES */

		// Style for selected feature(s)
		var style_selected = new ol.style.Style({
				fill: new ol.style.Fill({
				color: '#ff4d4d'
			}),
			stroke: new ol.style.Stroke({
				color: 'black',
				width: 0.5
			})
		});

		// Style for selected feature(s) that do not have critical habitat (state outline)
		var style_selected_noCH = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: 'rgba(255, 153, 153, 0.3)',
				width: 20
			})
		});
		
		// For each feature, read the hex color from the table and assign as style
		function styleFunction(feature) {
			// The features without critical habitat will not be drawn unless selected
			if (feature.get('state') == 'X') {
/* 				var color = hexToRgb(feature.get('color'));
				var colorRGB = 'rgba(' + color.r + ',' + color.g + ',' + color.b +  ',0.1)';
				var style = new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: colorRGB,
						width: 30
					})
				});	 */
			// Make fill have opacity of 0.3 and outline with opacity of 0.9 using rgba converted from hex
			} else {
				var color = hexToRgb(feature.get('color'));
				var colorRGB = 'rgba(' + color.r + ',' + color.g + ',' + color.b +  ',0.3)';
				var colorDarker = 'rgba(' + color.r + ',' + color.g + ',' + color.b +  ',0.9)';
				var style = new ol.style.Style({
					fill: new ol.style.Fill({
						color: colorRGB
					}),
					stroke: new ol.style.Stroke({
						color: colorDarker,
						width: 0.1
					})
				});					
			}
			return style;
		}

		// Flash feature on map when selected from table	
 		var flashSource = new ol.source.Vector({});
		var flashStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: 'white',
				width: 3
			})
		});
		var flashLayer = new ol.layer.Vector({
			source: flashSource,
			style: flashStyle
		});
		function flash(feature) {
			var flashGeom = feature.getGeometry().clone();
			var flashFeat = new ol.Feature({
				geometry: flashGeom
			});
			flashSource.addFeature(flashFeat);
			var i = 1;
			var interval = setInterval(function() {
				if (i % 2 == 0) {
					map.removeLayer(flashLayer);
				} else {
					map.addLayer(flashLayer);
				}
				if (i > 3) {
					clearInterval(interval);
					flashSource.removeFeature(flashFeat);
					map.removeLayer(flashLayer);
					return;
				}
				i++;				
			}, 300);
		}

		// POPUP CREATED WHEN USER SELECTS FEATURES FROM THE MAP
		
		// Add interaction to select features using a box
		var dragBox = new ol.interaction.DragBox({
			condition: ol.events.condition.platformModifierKeyOnly
		});
		map.addInteraction(dragBox);
		// Add dragbox event for when box is complete
		dragBox.on('boxend', function(evt) {
			var boxCoordinate = evt.coordinate;
			var boxFeatures = [];
			var extent = dragBox.getGeometry().getExtent();
			// Store an array of features located within dragbox
			crithabLayer.getSource().forEachFeatureIntersectingExtent(extent, function(feature) {
				boxFeatures.push(feature);
			});
			boxFeatures.sort(sortFeatures);
			// Create HTML table of selected features and display in popup
			if (boxFeatures.length > 0) {
				var html = '<table class="table table-bordered" id="speciesTable">' + 
								'<tr class="danger" color="#fff" bgcolor="#669999">' + 
									'<th color="#fff">Common Name&nbsp&nbsp</th>' + 
									'<th color="#fff">Scientific Name</th>' + 
								'</tr>'
				for (var i = 0, ii = boxFeatures.length; i < ii; ++i) {
					var origColor = boxFeatures[i].get('color');
					var colorRGB = hexToRgb(origColor).r + "," + hexToRgb(origColor).g + "," + hexToRgb(origColor).b;
					var w3Hsl = rgbToHsl(hexToRgb(origColor).r,hexToRgb(origColor).g,hexToRgb(origColor).b);
					var lum;
					if (w3Hsl.l > 0.8) {lum = w3Hsl.l + 0.1}
						else if (w3Hsl.l > 0.6) {lum = w3Hsl.l + 0.2}
						else {lum = w3Hsl.l + 0.3}
					var w3RGB = hslToRgb(w3Hsl.h, Math.round(w3Hsl.s * 100) / 100, Math.round(lum * 100) / 100);
					var w3Hex = toHexString(Math.round(w3RGB.r),Math.round(w3RGB.g),Math.round(w3RGB.b));
					html = html + '<tr bgcolor="' + w3Hex + '">' + 
									'<td>' + boxFeatures[i].get('comname') + '</td>' + 
									'<td>' + boxFeatures[i].get('sciname') + '</td>' + 
								  '</tr>'
				}
				var html = html + '</table>'
				content.innerHTML = html;
				popupButton.innerHTML = '<input type="button" value="Filter Table" ' + 
										'onclick="filterButtonFunction();" />';
				overlay.setPosition(boxCoordinate);
			}
		});
					
		// Add click event on map to show features at mouse click
		map.on('singleclick', function(evt) {
			var clickCoordinate = evt.coordinate;
			var clickFeatures = [];
			// Store an array of features located at mouse click location
			map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
				clickFeatures.push(feature);
			});
			clickFeatures.sort(sortFeatures);
			// Create HTML table of selected features and display in popup
			if (clickFeatures.length > 0) {
				var html = '<table class="table table-bordered" id="speciesTable">' + 
								'<tr class="danger" color="#fff" bgcolor="#669999">' + 
									'<th color="#fff">Common Name&nbsp&nbsp</th>' + 
									'<th color="#fff">Scientific Name</th>' + 
								'</tr>'
				for (var i = 0, ii = clickFeatures.length; i < ii; ++i) {
					var origColor = clickFeatures[i].get('color');
					var colorRGB = hexToRgb(origColor).r + "," + hexToRgb(origColor).g + "," + hexToRgb(origColor).b;
					var w3Hsl = rgbToHsl(hexToRgb(origColor).r,hexToRgb(origColor).g,hexToRgb(origColor).b);
					var lum;
					if (w3Hsl.l > 0.8) {lum = w3Hsl.l + 0.1}
						else if (w3Hsl.l > 0.6) {lum = w3Hsl.l + 0.2}
						else {lum = w3Hsl.l + 0.3}
					var w3RGB = hslToRgb(w3Hsl.h, Math.round(w3Hsl.s * 100) / 100, Math.round(lum * 100) / 100);
					var w3Hex = toHexString(Math.round(w3RGB.r),Math.round(w3RGB.g),Math.round(w3RGB.b));
					html = html + '<tr bgcolor="' + w3Hex + '">' + 
									'<td>' + clickFeatures[i].get('comname') + '</td>' + 
									'<td>' + clickFeatures[i].get('sciname') + '</td>' + 
								  '</tr>'
				}
				var html = html + '</table>'
				content.innerHTML = html;
				popupButton.innerHTML = '<input type="button" value="Filter Table" ' + 
										'onclick="filterButtonFunction();" />';
				overlay.setPosition(clickCoordinate);
			}
		});
		
		// Sort the records listed in the popup by the scientific name
		function sortFeatures(a,b) {
			return (a.get('sciname').toUpperCase() < b.get('sciname').toUpperCase()) ? -1 : ((a.get('sciname').toUpperCase() > b.get('sciname').toUpperCase()) ? 1 : 0);
		}
		
		/* STORE FEATURES FOR TABLE */

        // Create feature store by passing the vector layer
        featStore = Ext.create('GeoExt.data.store.Features', {
			layer: crithabLayer,
            map: map
        });
		featStore.sort([
			{
				property: 'state',
				direction: 'DESC'
			},{
				property: 'comname',
				direction: 'ASC'
			}
		]);
	
		/* FILTER TABLE WINDOW */
	
		// Create filter conditions based on filterpanel.js
		var filter = new Ext.ux.StoreFilter({  
			store: featStore,
			autoApply: true,
			border: false
		});

		// Create popup window providing filter options
		filterPanel = Ext.create('Ext.window.Window', {
			title: "Filters",
			closable: true,
			closeAction: 'hide',
			constrain: true,
			shadow: false,
			layout: 'fit',
			items: filter,
			width: 630,
			height: 200,
			renderTo: document.body,
			tools: [{
				id: 'unpin',
				handler: function(e, tool, panel, tc) {
					if (tool.hasClass('x-tool-pin')) {
						tool.addClass('x-tool-unpin');
						tool.removeClass('x-tool-pin');
						panel.plugins.unlock();
					} else {
						tool.addClass('x-tool-pin');
						tool.removeClass('x-tool-unpin');
						panel.plugins.lock();
					}
				}
			}],
			listeners: {
				close: function() {
					if (featStore.getFilters().length > 0) {
						var filterData = featStore.getFilters().items[1].scope.data.items;
						var filterListArray = [];
						for (var i = 0; i < filterData.length; i++) {
							filterListArray.push(filterData[i].data.spcode);
						}
						var filterList = "'" + filterListArray.join("','") + "'";
						filterMap(filterList);
					}
				}
			}
		});

		/* FILTER BY... WINDOW */

		// Create array of dropdown values
		var states = [["AL","Alabama"], ["AK","Alaska"], ["AS","American Samoa"], ["AZ","Arizona"], ["AR","Arkansas"], ["CA","California"], ["CO","Colorado"], ["MP","Commonwealth of the Northern Mariana Islands"], ["CT","Connecticut"], ["DE","Delaware"], ["DC","District of Columbia"], ["FL","Florida"], ["GA","Georgia"], ["GU","Guam"], ["HI","Hawaii"], ["ID","Idaho"], ["IL","Illinois"], ["IN","Indiana"], ["IA","Iowa"], ["KS","Kansas"], ["KY","Kentucky"], ["LA","Louisiana"], ["ME","Maine"], ["MD","Maryland"], ["MA","Massachusetts"], ["MI","Michigan"], ["MN","Minnesota"], ["MS","Mississippi"], ["MO","Missouri"], ["MT","Montana"], ["NE","Nebraska"], ["NV","Nevada"], ["NH","New Hampshire"], ["NJ","New Jersey"], ["NM","New Mexico"], ["NY","New York"], ["NC","North Carolina"], ["ND","North Dakota"], ["OH","Ohio"], ["OK","Oklahoma"], ["OR","Oregon"], ["PA","Pennsylvania"], ["PR","Puerto Rico"], ["RI","Rhode Island"], ["SC","South Carolina"], ["SD","South Dakota"], ["TN","Tennessee"], ["TX","Texas"], ["VI","United States Virgin Islands"], ["UT","Utah"], ["VT","Vermont"], ["VA","Virginia"], ["WA","Washington"], ["WV","West Virginia"], ["WI","Wisconsin"], ["WY","Wyoming"]];
		var hucs = ["0101000201","0101000202","0101000203","0101000204","0101000205","0101000206","0101000207","0101000301","0101000302","0101000303","0101000304","0101000401","0101000402","0101000403","0101000404","0101000405","0101000406","0101000407","0101000408","0101000409","0101000410","0101000411","0101000501","0101000502","0101000503","0101000601","0101000602","0101000701","0101000702","0101000703","0101000704","0101000705","0101000706","0101000707","0101000801","0101000804","0101000906","0101001002","0102000101","0102000102","0102000103","0102000104","0102000105","0102000106","0102000107","0102000108","0102000109","0102000110","0102000201","0102000202","0102000203","0102000204","0102000205","0102000301","0102000302","0102000303","0102000304","0102000305","0102000306","0102000307","0102000401","0102000402","0102000403","0102000404","0102000405","0102000406","0102000501","0102000502","0102000503","0102000504","0102000505","0102000506","0102000507","0102000508","0102000509","0102000510","0103000101","0103000102","0103000103","0103000104","0103000105","0103000106","0103000202","0103000204","0103000205","0103000302","0103000303","0103000304","0103000305","0103000306","0103000308","0103000309","0103000310","0103000311","0103000312","0103000313","0103000314","0103000315","0103000316","0103000317","0103000318","0103000319","0103000320","0103000321","0103000322","0103000323","0103000324","0104000101","0104000204","0104000205","0104000206","0104000208","0104000209","0104000210","0105000101","0105000103","0105000106","0105000108","0105000201","0105000202","0105000203","0105000204","0105000205","0105000206","0105000207","0105000208","0105000209","0105000210","0105000211","0105000212","0105000213","0105000214","0105000215","0105000216","0105000218","0105000219","0105000301","0105000302","0105000303","0105000304","0105000305","0105000306","0105000404","0105000405","0105000406","0105000407","0105000409","0106000102","0106000106","0109000201","0109000202","0109000203","0205030616","0205030617","0206000302","0207000103","0207000104","0302010502","0302010503","0302010504","0302020409","0302030103","0302030105","0302030107","0302030203","0302030204","0302030205","0303000304","0303000305","0303000306","0303000507","0303000508","0303000706","0303000708","0304010507","0304020201","0304020203","0304020603","0304020702","0304020801","0304020802","0304020803","0304020804","0305010103","0305010104","0305010105","0305010303","0305010306","0305011203","0305011204","0305020103","0305020104","0305020107","0305020202","0305020603","0305020604","0305020710","0305020711","0305020805","0305020806","0305020901","0305020902","0305021001","0306010701","0306010702","0306010903","0306011002","0306011003","0306020401","0306020403","0306020405","0306020407","0306020408","0307010408","0307010504","0307010601","0307010602","0307010603","0307010604","0307010605","0307010705","0307020302","0307020304","0307020305","0307020401","0307020402","0307020409","0307020503","0308010101","0308010104","0308010106","0308010107","0308010108","0308010109","0308010111","0308010112","0308010113","0308010116","0308010117","0308010120","0308010121","0308010214","0308010304","0308010306","0308010307","0308010308","0308010310","0308010311","0308010312","0308010313","0308010314","0308010315","0308010316","0308020101","0308020103","0308020105","0308020106","0308020201","0308020202","0308020203","0308020204","0308020301","0308020302","0308020303","0309010121","0309010302","0309010303","0309020102","0309020201","0309020202","0309020205","0309020206","0309020209","0309020211","0309020212","0309020213","0309020214","0309020301","0309020302","0309020303","0309020401","0309020402","0309020404","0309020405","0309020406","0309020407","0309020408","0309020409","0309020410","0309020411","0309020501","0309020506","0309020602","0309020605","0309020606","0309020608","0309020609","0309020610","0309020611","0309020612","0309020613","0309020614","0309020615","0309020616","0309020617","0310010108","0310010109","0310010111","0310010203","0310010204","0310010205","0310010301","0310010302","0310010303","0310020101","0310020102","0310020103","0310020201","0310020202","0310020301","0310020302","0310020605","0310020607","0310020701","0310020705","0311010105","0311010205","0311010209","0311020107","0311020108","0311020109","0311020309","0311020501","0311020502","0311020503","0311020504","0311020505","0311020506","0311020507","0311020508","0311020601","0311020602","0311020603","0311020604","0311020605","0312000110","0312000111","0312000203","0312000204","0312000205","0312000206","0312000207","0312000208","0312000301","0312000303","0312000308","0312000309","0312000312","0313000213","0313000305","0313000401","0313000407","0313000501","0313000502","0313000504","0313000505","0313000507","0313000509","0313000511","0313000514","0313000516","0313000601","0313000603","0313000604","0313000605","0313000606","0313000607","0313000608","0313000609","0313000701","0313000702","0313000703","0313000704","0313000705","0313000…30513","1808000302","1808000308","1808000309","1808000312","1809010103","1809010104","1809010202","1809010203","1809010204","1809010205","1809010206","1809010207","1809010208","1809010301","1809010302","1809010304","1809020214","1809020215","1809020217","1809020218","1809020219","1809020220","1809020311","1809020312","1809020314","1809020406","1809020412","1809020506","1809020509","1809020512","1809020513","1809020604","1809020606","1809020608","1809020609","1809020610","1809020611","1809020612","1809020613","1809020618","1809020619","1809020621","1809020622","1809020701","1809020702","1809020703","1809020704","1809020705","1809020706","1809020707","1809020708","1809020709","1809020710","1809020711","1809020801","1809020802","1809020804","1809020806","1809020807","1809020809","1809020810","1809020811","1809020812","1809020813","1809020814","1809020815","1809020817","1809020818","1809020819","1809020822","1809020823","1809020824","1809020825","1809020826","1810010001","1810010002","1810010003","1810010004","1810010005","1810010006","1810010007","1810010008","1810010009","1810010021","1810010023","1810010024","1810010027","1810010028","1810010030","1810010031","1810010032","1810010033","1810010034","1810010035","1810010036","1810010037","1810010038","1810010039","1810010041","1810010042","1810010043","1810010044","1810010045","1810010046","1810010048","1810010049","1810010050","1810010051","1810010052","1810010054","1810020101","1810020102","1810020103","1810020104","1810020105","1810020106","1810020107","1810020108","1810020201","1810020202","1810020203","1810020301","1810020302","1810020303","1810020304","1810020305","1810020306","1810020307","1810020308","1810020401","1810020402","1810020403","1810020405","1810020406","1810020407","1810020408","1810020409","1810020410","1810020412","1810020413","1810020415","1901040212","1901040216","1901040217","1902010416","1902010417","1902010418","1902020102","1902020103","1902020104","1902020106","1902020114","1902020115","1902020116","1902020118","1902020119","1902020120","1902020121","1902020123","1902020125","1902020201","1902020202","1902020203","1902020204","1902020206","1902020207","1902020208","1902020209","1902020210","1902020211","1902020212","1902020213","1902020214","1902020301","1902020302","1902020303","1902020304","1902020305","1902020306","1902020307","1902030112","1902060202","1902060204","1902060205","1902060206","1902060207","1902060209","1902060212","1902060213","1902070101","1902070102","1902070103","1902070104","1902070105","1902070106","1902070107","1902070108","1902070109","1902070110","1902070111","1902070112","1902070113","1902070114","1902070115","1902070116","1902070117","1902070118","1902070119","1902070120","1902070121","1902070201","1902070202","1902070203","1902070204","1902070205","1902070206","1902070207","1902070208","1902070209","1902070210","1902070211","1902070212","1902070214","1902070215","1902070216","1902070217","1902070218","1902080000","1903010101","1903010102","1903010103","1903010107","1903010108","1903010110","1903010111","1903010112","1903010113","1903010114","1903010115","1903010116","1903010117","1903010118","1903010119","1903010120","1903010121","1903010122","1903010123","1903010124","1903010125","1903010202","1903010203","1903010204","1903010205","1903010206","1903010207","1903010208","1903010209","1903010210","1903010211","1903010212","1903010213","1903010214","1903010215","1903010300","1903010400","1903020104","1903020105","1903020110","1903030511","1903030515","1903030516","1903030518","1903030519","1903030520","1903050249","1903050250","1903050251","1903050255","1903050258","1903050259","1903050260","1903050261","1903050264","1903050286","1903050287","1903050308","1905010100","1905010204","1905010205","1905010206","1905010214","1905010215","1905010216","1905010220","1905010221","1905010222","1905010317","1906010112","1906010113","1906010116","1906010316","1909030527","1909030528","1909030529","1909030537","1909030538","1909030539","1909030541","1909030542","1909030544","1909030545","1909030546","2001000001","2001000002","2001000003","2001000004","2001000005","2001000006","2001000007","2001000008","2001000009","2001000010","2001000011","2001000012","2001000013","2001000014","2001000015","2002000001","2002000002","2002000003","2002000004","2002000005","2002000006","2002000007","2003000001","2004000001","2004000002","2004000003","2004000004","2005000001","2005000002","2005000003","2005000004","2006000001","2006000002","2006000003","2006000004","2006000005","2007000001","2007000002","2007000003","2007000004","2007000005","2008000001","2101000201","2101000202","2101000203","2101000204","2101000205","2101000301","2101000302","2101000303","2101000304","2101000401","2101000402","2101000403","2101000404","2101000405","2101000501","2101000502","2101000503","2101000504","2101000505","2101000506","2101000507","2101000601","2101000602","2101000603","2102000101","2102000102","2102000201","2102000202","2201000001","2201000004"];

		// Create the Select Geography Type combo box
		var typeCombo = new Ext.form.ComboBox({
			fieldLabel: 'Select Geography Type',
			labelWidth: 'width:20%',
			id: 'typeCombo',
			name: 'geogtype',
			store: ['State', 'HUC10'],
			queryMode: 'local',
			width: '90%',
			listeners: {
				'change': function(combo,value,index) {
					var input = combo.getValue();
					if (input == 'State'){
						hucCombo.hide();
						stateCombo.show();
					} else if (input == 'HUC10') {
						stateCombo.hide();
						hucCombo.show();
					}
				}
			}
		});

		// Create the Select the State combo box
		var stateCombo = new Ext.form.ComboBox({
			fieldLabel: 'Select the State',
			id: 'stateCombo',
			labelWidth: 'width:20%',
			store: states,
			fields: ['abbr','name'],
			displayField: 'name',
			valueField: 'abbr',
			scrollable: true,
			maxHeight: 50,
			typeAhead: true,
			hidden: true,
			queryMode: 'local',
			width: '90%',
			listeners: {
				'show': function(combo,value,index) {
					var input = combo.getValue();
					if (input == '' || input == null) {
						Ext.getCmp('selectButton').setDisabled(true);
					} else {
						Ext.getCmp('selectButton').setDisabled(false);
					}
				},
				'change': function(combo,value,index) {
					var input = combo.getValue();
					if (input == '' || input == null) {
						Ext.getCmp('selectButton').setDisabled(true);
					} else {
						Ext.getCmp('selectButton').setDisabled(false);
					}
				}
			}	
		});

		// Create the Select the HUC10 combo box
		var hucCombo = new Ext.form.ComboBox({
			fieldLabel: 'Select the HUC10',
			id: 'hucCombo',
			labelWidth: 'width:20%',
			store: hucs,
			scrollable: true,
			maxHeight: 50,
			typeAhead: true,
			hidden: true,
			queryMode: 'local',
			width: '90%',
			listeners: {
				'show': function(combo,value,index) {
					var input = combo.getValue();
					if (input == '' || input == null) {
						Ext.getCmp('selectButton').setDisabled(true);
					} else {
						Ext.getCmp('selectButton').setDisabled(false);
					}
				},
				'change': function(combo,value,index) {
					var input = combo.getValue();
					if (input == '' || input == null) {
						Ext.getCmp('selectButton').setDisabled(true);
					} else {
						Ext.getCmp('selectButton').setDisabled(false);
					}
				}
			}			
		});
				
		// Create the Select by Geography panel
		var selectForm = Ext.create('Ext.form.Panel', {
			bodyPadding: 5,
			width: 350,
			layout: 'anchor', 
			items: [typeCombo, stateCombo, hucCombo],
			buttons: [{
				text: 'Filter',
				id: 'selectButton',
				disabled: true,
				listeners: {
					'click': function(){
						//Select table rows based on state
						if (Ext.getCmp('typeCombo').value == 'State') {
							var selectedValue = Ext.getCmp('stateCombo').value;
							var valueList = [];
							var list = d3.csv("data/species_state_list.csv", function(data) {
								data.forEach(function(d) {
									if (d.STATE == selectedValue) {
										var currCode = d.SPCODE;
										valueList.push(currCode);
									}
								});
								var filterString = valueList.toString();
								var selectedItems = filterString.split(",");
								featStore.clearFilter();
								featStore.filterBy(function(record, id) {
									return Ext.Array.indexOf(selectedItems, record.get("spcode")) !== -1;
								}, this);
								mapFilter = "'" + valueList.join("','") + "'";
								filterMap(mapFilter);
							});
						//Select table rows based on HUC10
						} else if (Ext.getCmp('typeCombo').value == 'HUC10') {
							var selectedValue = Ext.getCmp('hucCombo').value;
							var valueList = [];
							var list = d3.csv("data/HUC10_to_CH.csv", function(data) {
								data.forEach(function(d) {
									if (d.HUC10 == selectedValue) {
										var currCode = d.spcode;
										valueList.push(currCode);
									}
								});
								var filterString = valueList.toString();
								var selectedItems = filterString.split(",");
								featStore.clearFilter();
								featStore.filterBy(function(record, id) {
									return Ext.Array.indexOf(selectedItems, record.get("spcode")) !== -1;
								}, this);
								mapFilter = "'" + valueList.join("','") + "'";
								filterMap(mapFilter);
							});
						}
					}
				}
			}]
		});

		// Create the Select by Geography window
		selectPanel = Ext.create('Ext.window.Window', {
			title: "Select by Geography",
			closable: true,
			closeAction: 'hide',
			constrain: true,
			shadow: false,
			layout: 'fit',
			items: selectForm,
			width: 500,
			height: 200,
			renderTo: document.body
		});
		
		/* CREATE THE TABLE GRID */
		
		// Create the table grid showing all features from the feature store (vector layer)
        gridSouth = Ext.create('Ext.grid.Panel', {
            title: 'Endangered/Threatened Species',
            border: true,
            region: 'south',
            store: featStore,
			flex: 2,
			allowDeselect: true,
			selModel: {
				mode: 'MULTI'
			},
            columns: [
				{text: '', dataIndex: 'color', flex: 0.11, renderer: function (value) {
						return '<span style="background-color:' + value + ';opacity:0.4;">&nbsp&nbsp&nbsp&nbsp</span>';
					}
				},
                {text: 'Common Name', dataIndex: 'comname', flex: 1.5},
                {text: 'Scientific Name', dataIndex: 'sciname', flex: 1.5},
				{text: 'Status', dataIndex: 'listing_st', flex: 0.65},
				{text: 'Species Type', dataIndex: 'type', flex: 0.65},
				{text: 'Species Group', dataIndex: 'group_', flex: 0.65},
				{text: 'Species Family', dataIndex: 'family', flex: 0.75},
				{text: 'Listing Date', dataIndex: 'list_date', flex: 0.65, xtype: 'datecolumn', format: 'Y-m-d'},
				{text: 'No CH', dataIndex: 'state', flex: 0.5},
				{text: 'Species Code', dataIndex: 'spcode', flex: 1},
				{
					xtype: 'actioncolumn',
					width: 10,
					flex: 0.1,
					items: [{
						icon: 'images/info-icon.png',
						tooltip: 'More info',
						handler: function(grid, rowIndex,colIndex) {
							var rec = gridSouth.getStore().getAt(rowIndex);
							var url = 'http://ecos.fws.gov/ecp0/profile/speciesProfile?spcode=' + rec.get('spcode');
							window.open(url, '_blank');
						}
					}]
				}
            ],
            width: 250,
			tbar: [{
				text: 'Filter Table ...',
				handler: function(b, e) {
					filterPanel.alignTo(gridSouth.el, 't-t');
					filterPanel.show();
					filterPanel.el.slideIn('t');
					filterPanel.locked = true;
					filterPanel.el.setOpacity(1);
				}
			}, {
				xtype: 'tbseparator'
			}, {
				text: 'Filter by ...',
				listeners: {
					click: function(grid,selected) {
						selectPanel.show();
					}
				}
			}, {
				xtype: 'tbseparator'
			}, {
				text: 'Filter to Selected',
				listeners: {
					click: function(grid,selected) {
						var selections = gridSouth.getSelectionModel().getSelection();
						var items = new Array();
						for (var i = 0, ln = selections.length; i < ln; i++) {
							items.push(selections[i].data.spcode);
						};
						var filterString = items.toString();
						var selectedItems = filterString.split(",");
						featStore.clearFilter();
						featStore.filterBy(function(record, id) {
							return Ext.Array.indexOf(selectedItems, record.get("spcode")) !== -1;
						}, this);
						mapFilter = "'" + items.join("','") + "'";
						filterMap(mapFilter);
					}
				}
			}, {
				xtype: 'tbseparator'
			}, {
				text: 'Zoom to Selected',
				listeners: {
					click: function(grid,selected) {
						var selections = gridSouth.getSelectionModel().getSelection();
						var extent = ol.extent.createEmpty();
						for (var i = 0, ln = selections.length; i < ln; i++) {
							extent = ol.extent.extend(extent, selections[i].getFeature().getGeometry().getExtent());
						};
						map.getView().fit(extent, map.getSize());
					}
				}
			}, {
				xtype: 'tbseparator'
			}, {
				text: 'Clear Filter',
				listeners: {
					click: function(grid,selected) {
						featStore.clearFilter();
						unfilterMap();
					}
				}
			}, {
				xtype: 'tbseparator'
			}, {
				text: 'Clear Selection',
				listeners: {
					click: function(grid,selected) {
						gridSouth.getSelectionModel().deselectAll();
					}
				}
			}, {
				xtype: 'tbseparator'
			}, {
				text: 'View Charts',
				listeners: {
					click: function(grid,selected) {
						window.open("barchart.html");
					}
				}
			}
			],
			listeners: {
				'render': function(grid) {
					grid.columns[9].setVisible(false);
				},
 				'selectionchange': function(grid, selected) {
                    // reset all selections
                    featStore.each(function(rec) {
						rec.getFeature().setStyle(styleFunction(rec.getFeature()));
                    });
                    // highlight grid selection in map
                    Ext.each(selected, function(rec) {
						if (rec.getFeature().get('state') == 'X') {
							rec.getFeature().setStyle(style_selected_noCH);
						} else {
							rec.getFeature().setStyle(style_selected);
						}
                    });
                },
				itemclick: function(grid, selected) {
					// flash the selected feature on the map
					Ext.each(selected, function(rec) {
						flash(rec.getFeature());
					});
				},
				itemdblclick: function(grid, selected) {
					// zoom to the map to the selected feature
					Ext.each(selected, function(rec) {
						extent = rec.getFeature().getGeometry().getExtent();
						map.getView().fit(extent, map.getSize());
					})
				}		
			}
        });

		/* CREATE THE COMPONENTS OF THE WEB PAGE */
		
		// Create the map component
        var mapComponent = Ext.create('GeoExt.component.Map', {
            map: map
        });
		
		// Create the map panel
        var mapPanel = Ext.create('Ext.panel.Panel', {
            region: 'center',
			flex: 3,
            items: [mapComponent]
        });
		
		// Create the header panel
        var description = Ext.create('Ext.panel.Panel', {
            region: 'north',
            height: 30,
            border: false,
            autoScroll: true,
			flex: 0,
			html: '<div class="myHeader">' +
				  '<h4 style="background-image: url(images/wetland_60.jpg); ' +
				  'margin: 0px; ' +
				  'background-size: 100% 100%; ' +
				  'background-repeat: no-repeat; ' +
				  'height: 30px; width: 100%; ' +
				  'border: 1px solid white;">' +
				  'Critical Habitat of Endangered/Threatened Species in the U.S. and Territories' +
				  '</h2></div>'
        });
	
		// Create the web page layout
        Ext.create('Ext.Viewport', {
            layout: 'border',
            items: [description, mapPanel, gridSouth]
        });
		
    }
});
