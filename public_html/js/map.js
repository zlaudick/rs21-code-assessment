// Generically loads a JSON file
function loadJSON(jsonUrl) {
	return $.ajax({
		url: jsonUrl,
		dataType: "json"
	});
}

// draw map key
function drawKey() {
	// key width/height in pixels
	var width = 215, height = 275;

	// grab key element
	var key = d3.select("#key");
	var svg = key.append("svg")
		.attr("width", width)
		.attr("height", height);

	// define green commuters gradient
	var greenGradient = svg.append("svg:defs")
		.append("svg:linearGradient")
		.attr("id", "greenGradient")
		.attr("x1", "50%")
		.attr("y1", "0%")
		.attr("x2", "50%")
		.attr("y2", "100%")
		.attr("spreadMethod", "pad");

	// define gradient colors
	greenGradient.append("svg:stop")
		.attr("offset", "0%")
		.attr("stop-color", "rgb(0, 200, 0)")
		.attr("stop-opacity", 1);
	greenGradient.append("svg:stop")
		.attr("offset", "100%")
		.attr("stop-color", "rgb(0, 200, 0)")
		.attr("stop-opacity", 0);

	// define green commuters bar
	var greenBar = svg.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", (width/10))
		.attr("height", height)
		.style("fill", "url(#greenGradient)");

	// define green commuters bar labels
	var greenOffset = 5;
	var textMin = "0% are green commuters", textMax = "100% are green commuters";
	var greenTextMax = svg.append("text")
		.attr("x", ((width/10) + greenOffset))
		.attr("y", 15)
		.text(textMax);
	var greenTextMin = svg.append("text")
		.attr("x", ((width/10) + greenOffset))
		.attr("y", (height - greenOffset))
		.text(textMin);
}

// parses the census block JSON to perform calculations on the target data
function parseCensusJson(censusJson) {
	var totalCommuters = "ACS_13_5YR_B08301_with_ann_HD01_VD01";
	var carpool = "ACS_13_5YR_B08301_with_ann_HD01_VD04";
	var publicTransport = "ACS_13_5YR_B08301_with_ann_HD01_VD10";
	var bicycle = "ACS_13_5YR_B08301_with_ann_HD01_VD18";
	var walked = "ACS_13_5YR_B08301_with_ann_HD01_VD19";


	// find the percentage of green commuters
	var averageGreenCommuters = [];
	censusJson.features.forEach(function(feature) {
		// find total green commuters
		var greenCommuters = (Number(feature.properties[carpool])) + (Number(feature.properties[publicTransport])) + (Number(feature.properties[bicycle])) + (Number(feature.properties[walked]));

		// find average green commuters
		if(greenCommuters > 0) {
			averageGreenCommuters.push(greenCommuters / Number(feature.properties[totalCommuters]));
		}
	});

	var scale = d3.scaleLinear().domain([d3.min(averageGreenCommuters), d3.max(averageGreenCommuters)]).range([0, 1]);

	censusJson.features.forEach(function(feature) {
		// total green commuters
		var greenCommuters = (Number(feature.properties[carpool])) + (Number(feature.properties[publicTransport])) + (Number(feature.properties[bicycle])) + (Number(feature.properties[walked]));
		// Prepare base fill and stroke
		// fill (color), fill-opacity (0-1), stroke (color), stroke-opacity (0-1), stroke-width (px), title (string)
		var percentGreen = 0;
		var fillOpacity = 0;
		if(greenCommuters > 0) {
			percentGreen = greenCommuters / Number(feature.properties[totalCommuters]);
			fillOpacity = scale(percentGreen);
		}
		var stroke = "rgb(100, 100, 100)", fill = "rgba(0, 200, 0, " + fillOpacity + ")", strokeWidth = "2";

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
	map.setView([35.0853, -106.6291], 12);

	// load json and perform calculations
	$.when(loadJSON("data/BernalilloCensusBlocks_Joined.json")).done(function(json) {
		var censusJson = parseCensusJson(json);

		// Census block feature layer
		var censusBlocks = L.mapbox.featureLayer().setGeoJSON(censusJson[0]).addTo(map);

		drawKey();
	});
});


