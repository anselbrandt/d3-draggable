// https://observablehq.com/@sergeyobodovskiy/interactive-line-chart

const style = `
<style>
.dot {
  cursor: move;
  fill: steelblue;
}

.selected {
  stroke: seagreen;
  stroke-width: 3px;
  fill: seagreen;
}

.drag-active{
  fill: red;
}

</style>
`;

const heightSvg = 700;

const points = d3.range(10).map((d, i) => [i, d3.randomUniform(1)()]);

const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const width2 = width - margin.left - margin.right;
const height = heightSvg - margin.top - margin.bottom;
const xScale = d3.scaleLinear().range([0, width2]);
const yScale = d3.scaleLinear().range([height, 0]);

const dotRadius = 5;

xScale.domain([0, d3.max(points, (d) => d[0])]);
yScale.domain([0, d3.max(points, (d) => d[1])]);

const svg = d3.select(DOM.svg(width2, width2));
const line = d3
  .line()
  .x(function (d) {
    return xScale(d[0]);
  })
  .y(function (d) {
    return yScale(d[1]);
  })
  .curve(d3.curveMonotoneX); // apply smoothing to the line

const drag = d3
  .drag()
  .on("start", dragstarted)
  .on("drag", dragged)
  .on("end", dragended);

const svgContent = svg
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const xAxis = svgContent
  .append("g")
  .attr("class", "axis axis--x")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(xScale));

const yAxis = svgContent
  .append("g")
  .attr("class", "axis axis--y")
  .call(d3.axisLeft(yScale));

const clip = svgContent
  .append("defs")
  .append("svg:clipPath")
  .attr("id", "clip")
  .append("svg:rect")
  .attr("width", width2)
  .attr("height", height)
  .attr("x", 0)
  .attr("y", 0);

const chartContent = svgContent.append("g").attr("clip-path", "url(#clip)");

chartContent
  .append("path")
  .datum(points)
  .attr("class", "line")
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-linejoin", "round")
  .attr("stroke-linecap", "round")
  .attr("stroke-width", 1.5)
  .attr("d", line);

function dragstarted(d) {
  d3.select(this).raise().classed("active", true);
}

function dragged(d) {
  const minY = dotRadius;
  const maxY = height;
  // d[0] = xScale.invert(d3.event.x);
  if (Math.sign(d3.event.y) !== -1 && d3.event.y < height) {
    d[1] = yScale.invert(d3.event.y);
  }

  d3.select(this)
    /* disable horizontal dragging
    .attr("cx", xScale(d[0])) */
    // .attr("cy", yScale(d[1]))
    .attr("cy", (d.y = Math.max(minY, Math.min(maxY, d3.event.y))));
  chartContent.select("path").attr("d", line);
}

function dragended(d) {
  d3.select(this).classed("active", false);
}

const brush = d3
  .brushX()
  .extent([
    [0, 0],
    [width2, height],
  ])
  .filter(() => d3.event.button === 2)
  .on("end", brushedXBrushEnded);

// Add the brushing
chartContent.append("g").attr("class", "brush").call(brush);

const rectBrush = d3
  .brush()
  .extent([
    [0, 0],
    [width2, height],
  ])
  .on("start brush", brushedRectBrushStartBrush);

// Add the rectangle brushing
chartContent.append("g").attr("class", "rect-brush").call(rectBrush);

// Function that is triggered when brushing is performed
function brushedRectBrushStartBrush() {
  console.log(d3.event.type, d3.event.sourceEvent.type);

  const extent = d3.event.selection;
  dots.classed("selected", function (d) {
    return isBrushed(extent, xScale(d[0]), yScale(d[1]));
  });
}

// A function that return TRUE or FALSE according if a dot is in the selection or not
function isBrushed(brush_coords, cx, cy) {
  const x0 = brush_coords[0][0];
  const x1 = brush_coords[1][0];
  const y0 = brush_coords[0][1];
  const y1 = brush_coords[1][1];

  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

// Add circles after brush for make it draggable
const dots = chartContent
  .selectAll("circle")
  .data(points)
  .enter()
  .append("circle")
  .attr("class", "dot")
  .attr("r", dotRadius)
  .attr("cx", function (d) {
    return xScale(d[0]);
  })
  .attr("cy", function (d) {
    return yScale(d[1]);
  });

chartContent.selectAll("circle").call(drag);

chartContent.on("contextmenu", () => {
  d3.event.preventDefault();
});

// A function that set idleTimeOut to null
let idleTimeout;
function idled() {
  idleTimeout = null;
}

// A function that update the chart for given boundaries
function brushedXBrushEnded() {
  console.log(d3.event.type, d3.event.sourceEvent.type);
  // if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
  const extent = d3.event.selection;

  // If no selection, back to initial coordinate. Otherwise, update X axis domain
  if (!extent) {
    if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
    xScale.domain([0, 9]);
  } else {
    xScale.domain([xScale.invert(extent[0]), xScale.invert(extent[1])]);
    chartContent.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
  }

  // Update axis and circle position
  xAxis
    /*.transition()
    .duration(1000)*/
    .call(d3.axisBottom(xScale));

  chartContent
    .selectAll("circle")
    // .transition()
    // .duration(1000)
    .attr("cx", function (d) {
      return xScale(d[0]);
    })
    .attr("cy", function (d) {
      return yScale(d[1]);
    });

  chartContent
    .selectAll(".line")
    .datum(points)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    // .transition()
    // .duration(1000)
    .attr("d", line);
}
