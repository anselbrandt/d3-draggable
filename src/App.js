import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import useGetViewport from "./useGetViewport";
import * as d3 from "d3";
import { GithubIcon } from "./GithubIcon";

function App() {
  const { width: viewportWidth, height: viewportHeight } = useGetViewport();
  const svgRef = useRef();
  const svgWidth = viewportWidth * 0.8;
  const svgHeight = viewportHeight * 0.7;
  const color = ["steelblue", "hotpink", "tomato"];

  const data = useRef([
    d3.range(10).map((d, i) => [i, d3.randomUniform(1)()]),
    d3.range(10).map((d, i) => [i, d3.randomUniform(1)()]),
    d3.range(10).map((d, i) => [i, d3.randomUniform(1)()]),
  ]);
  const selected = useRef();
  const [values, setValues] = useState(
    data.current.map((datum) => datum.map((value) => value[1]))
  );

  useEffect(() => {
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;
    if (data.current) {
      const xScale = d3.scaleLinear().range([0, width]);
      const yScale = d3.scaleLinear().range([height, 0]);
      const dotRadius = 5;

      const line = d3
        .line()
        .x(function (d) {
          return xScale(d[0]);
        })
        .y(function (d) {
          return yScale(d[1]);
        })
        .curve(d3.curveMonotoneX);

      const chart = () => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("g").remove();
        svg.attr("width", `${svgWidth}px`).attr("height", `${svgHeight}px`);

        xScale.domain([0, 10]);
        yScale.domain([0, 1]);

        const svgContent = svg
          .append("g")
          .attr(
            "transform",
            "translate(" + margin.left + "," + margin.top + ")"
          );

        // xAxis
        svgContent
          .append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(xScale));

        // yAxis
        svgContent
          .append("g")
          .attr("class", "axis axis--y")
          .call(d3.axisLeft(yScale));

        //clip
        svgContent
          .append("defs")
          .append("svg:clipPath")
          .attr("id", "clip")
          .append("svg:rect")
          .attr("width", width)
          .attr("height", height)
          .attr("x", 0)
          .attr("y", 0);

        const chartContent = svgContent
          .append("g")
          .attr("clip-path", "url(#clip)");

        data.current.forEach((datum, index) => {
          chartContent
            .append("path")
            .datum(datum)
            .attr("class", "line" + index)
            .attr("fill", "none")
            .attr("stroke", color[index])
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);

          // dots
          chartContent
            .selectAll(".dot" + index)
            .data(datum)
            .enter()
            .append("circle")
            .attr("class", "dot" + index)
            .style("fill", color[index])
            .attr("r", dotRadius)
            .attr("cx", function (d) {
              return xScale(d[0]);
            })
            .attr("cy", function (d) {
              return yScale(d[1]);
            });
        });

        const dragstarted = (event) => {
          d3.select(this).raise().classed("active", true);
          const dotCoords = event.subject;
          data.current.forEach((datum, row) => {
            if (datum.includes(dotCoords)) {
              const col = datum.indexOf(dotCoords);
              selected.current = [row, col];
            }
          });
        };

        const dragged = (event) => {
          const yVal = yScale.invert(event.y);
          if (Math.sign(event.y) !== -1 && event.y < height) {
            const newData = data.current.map((datum, index) => {
              if (index === selected.current[0]) {
                return datum.map((value, index) => {
                  if (index === selected.current[1]) {
                    return [value[0], yVal];
                  } else return value;
                });
              } else return datum;
            });
            data.current = newData;
            const newValues = newData.map((datum) =>
              datum.map((value) => value[1])
            );
            setValues(newValues);
            chartContent.select(".line" + selected.current[0]).remove();
            chartContent
              .append("path")
              .datum(newData[selected.current[0]])
              .attr("class", "line" + selected.current[0])
              .attr("fill", "none")
              .attr("stroke", color[selected.current[0]])
              .attr("stroke-linejoin", "round")
              .attr("stroke-linecap", "round")
              .attr("stroke-width", 1.5)
              .attr("d", line);
            chartContent.selectAll(".dot" + selected.current[0]).remove();
            chartContent
              .selectAll(".dot" + selected.current[0])
              .data(newData[selected.current[0]])
              .enter()
              .append("circle")
              .attr("class", "dot" + selected.current[0])
              .style("fill", color[selected.current[0]])
              .attr("r", dotRadius)
              .attr("cx", function (d) {
                return xScale(d[0]);
              })
              .attr("cy", function (d) {
                return yScale(d[1]);
              });
          }
        };

        const dragended = () => {
          console.log("end");
        };

        const drag = d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
        chartContent.selectAll("circle").call(drag);

        chartContent.on("contextmenu", (event) => {
          event.preventDefault();
        });
      };
      chart();
    }
  }, [svgHeight, svgWidth]);

  return (
    <div className="App">
      <div className="Title">Interactive Line Chart</div>
      <div className="SubTitle">
        <a href="https://observablehq.com/@sergeyobodovskiy/interactive-line-chart">
          Observable Example
        </a>{" "}
        Implemented in React
      </div>
      <div style={{ marginTop: "40px" }}>
        <div>
          {values.map((row, index) => (
            <div
              key={index}
              style={{
                color: `${color[index]}`,
                width: `${svgWidth * 0.92}px`,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              {row.map((value, index) => (
                <div key={index} style={{ width: "92px" }}>
                  {value.toFixed(2)}
                </div>
              ))}
            </div>
          ))}
        </div>
        <svg ref={svgRef} overflow="visible">
          <g className="xAxis" />
          <g className="yAxis" />
        </svg>
      </div>
      <div
        style={{
          width: `${svgWidth}px`,
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <div>
          <a href="https://github.com/anselbrandt/d3-draggable/blob/master/src/App.js">
            <GithubIcon fill={"black"} size={"20"} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
