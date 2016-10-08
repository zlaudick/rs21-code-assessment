// Generically loads a JSON file
function loadJSON(jsonUrl) {
	return $.ajax({
		url: jsonUrl,
		dataType: "json"
	});
}


// parses the census block JSON to perform calculations on the target data
function parseCensusJson(censusJson) {
	var totalCommuters = "ACS_13_5YR_B08301_with_ann_HD01_VD01";
	var carpool = "ACS_13_5YR_B08301_with_ann_HD01_VD04";
	var publicTransport = "ACS_13_5YR_B08301_with_ann_HD01_VD10";
	var bicycle = "ACS_13_5YR_B08301_with_ann_HD01_VD18";
	var walked = "ACS_13_5YR_B08301_with_ann_HD01_VD19";
	var greenCommuters = carpool + publicTransport + bicycle + walked;

	censusJson = {
		"type": "FeatureCollection",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": []
	};

	censusJson.features.push({
		"type": "Feature",
		"properties": []
	});



	// find the percentage of green commuters
	var averageGreenCommuters = null;
	censusJson.features.forEach(function(feature) {
		if(Number(feature.properties[totalCommuters]) > 0) {
			averageGreenCommuters.push(Number(feature.properties[greenCommuters]) / Number(feature.properties[totalCommuters]));
		}
	});

	var scale = d3.scaleLinear().domain([d3.min(averageGreenCommuters), d3.max(averageGreenCommuters)]).range([0, 1]);

	censusJson.features.forEach(function(feature) {
		// Prepare base fill and stroke
		// fill (color), fill-opacity (0-1), stroke (color), stroke-opacity (0-1), stroke-width (px), title (string)
		var percentGreen = 0;
		var fillOpacity = 0;
		if(Number(feature.properties[greenCommuters]) > 0) {
			percentGreen = Number(feature.properties[greenCommuters]) / Number(feature.properties[totalCommuters]);
			fillOpacity = scale(percentGreen);
		}
		var stroke = "rgb(90, 150, 90)", fill = "rgba(90, 200, 90, " + fillOpacity + ")", strokeWidth = "2";

		// Add the fill and stroke to the block
		feature.properties.fill = fill;
		feature.properties.stroke = stroke;
		feature.properties["stroke-width"] = strokeWidth;
		feature.properties.title = feature.properties["ACS_13_5YR_B08301_with_ann_GEO.display-label"] + "<br>Green Commuters: " + String(percentGreen.toFixed(4) * 100).substr(0, 5) + "%";
	});

	var minMax = [d3.min(averageGreenCommuters), d3.max(averageGreenCommuters)];
	return [censusJson, minMax];
}


$(document).ready(function() {
	// add the actual map
	L.mapbox.accessToken = "pk.eyJ1IjoiemxhdWRpY2siLCJhIjoiY2l0ejYxbDNzMGE4ZjMzcGxhamR2eHZ4ZiJ9.1tLKHpx2rejGNSMYjCYk1w";
	var map = L.mapbox.map("map", "mapbox.light");
	map.setView([35.13, -106.6291], 12);

	overlays = L.layerGroup().addTo(map);

	// load json and perform calculations
	$.when(loadJSON("data/BernalilloCensusBlocks_Joined.json")).done(function(json) {
		var censusJson = parseCensusJson(json[0]);

		// Census block feature layer
		var censusBlocks = L.mapbox.featureLayer().setGeoJSON(censusJson[0]).addTo(map);
		map.addLayer(censusBlocks);
	});
});


