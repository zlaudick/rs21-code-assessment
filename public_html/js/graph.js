// Generically loads a JSON file
function loadJSON(jsonUrl) {
	return $.ajax({
		url: jsonUrl,
		dataType: "json"
	});
}

function getGraphData(censusJson) {
	var totalCommuters = "ACS_13_5YR_B08301_with_ann_HD01_VD01";
	var carpool = "ACS_13_5YR_B08301_with_ann_HD01_VD04";
	var publicTransport = "ACS_13_5YR_B08301_with_ann_HD01_VD10";
	var bicycle = "ACS_13_5YR_B08301_with_ann_HD01_VD18";
	var walked = "ACS_13_5YR_B08301_with_ann_HD01_VD19";
	var medAge = "ACS_13_5YR_B01002_with_ann_HD01_VD02";

	// find the percentage of green commuters
	var averageGreenCommuters = [];
	var medianAge = [];
	censusJson.features.forEach(function(feature) {
		// find total green commuters
		var greenCommuters = (Number(feature.properties[carpool])) + (Number(feature.properties[publicTransport])) + (Number(feature.properties[bicycle])) + (Number(feature.properties[walked]));

		// find average green commuters
		if(greenCommuters > 0) {
			averageGreenCommuters.push(greenCommuters / Number(feature.properties[totalCommuters]));
		}

		medianAge.push(Number(feature.properties[medAge]));
	});
	return [averageGreenCommuters, medianAge];
}


$(document).ready(function() {


	$.when(loadJSON("../data/BernalilloCensusBlocks_Joined.json")).done(function(json) {
		var graphData = getGraphData(json);
		// console.log(graphData);
		console.log(graphData[0]);
		console.log(graphData[1]);
		var percentGreen = graphData[0];
		var medianAge = graphData[1];


		var margin = 100;
		var svgMargin = {top: margin, right: margin, bottom: margin, left: margin};
		var svgTotalWidth = 800;
		var svgTotalHeight = 800;
		var svgWidth = svgTotalWidth - svgMargin.left - svgMargin.right;
		var svgHeight = svgTotalHeight - svgMargin.top - svgMargin.bottom;

		var svg = d3.select("#output")
			.append("svg")
			.attr("width", svgTotalWidth)
			.attr("height", svgTotalHeight)
			.append("g")
			.attr("transform", "translate(" + svgMargin.left + "," + svgMargin.top + ")");


		var xScale = d3.scale.linear()
			.domain([0, percentGreen.length])
			.range([0, svgWidth]);
		var yScale = d3.scale.linear()
			.domain([0, d3.max(percentGreen)])
			.range([svgHeight, 0]);

		var lineFunction = d3.svg.line()
			.x(function(d, i) {
				return xScale(i);
			})
			.y(function(d) {
				return yScale(d);
			})
			.interpolate("cardinal");

		svg.append("path")
			.attr("class", "testLine")
			.attr("d", lineFunction(percentGreen));


	});

});