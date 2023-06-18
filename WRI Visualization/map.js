const WIDTH = 1380;
const HEIGHT = 700;
const HOVER_COLOR = '#070';
const MAP_COLOR_RANGE = ['#2a39a4', '#951010'];
const DISASTER_TYPES = ["Avalanche", "Landslide", "Health Crisis", "Earthquake/Tsunami", "Flood", "Tropical Cyclone/Hurricane", "Volcanic Eruption", "Other"];
const INITIAL_BORDER_STROKE_WIDTH = 0.2;

const mapColorScale = d3.scaleLinear().domain([0, 50]).range(MAP_COLOR_RANGE);
const disasterColors = ["#ffFFFFbb", "#00FF00bb", "#FF1493bb", "#FFD700bb", "#00FFFFbb", "#0088ffbb", "#9467cabb", "#FF7F50bb"];
const graphColor = d3.scaleOrdinal()
    .domain(DISASTER_TYPES)
    .range(disasterColors);

function onDropdownChange(_) {
    g.selectAll('path')
        .transition()
        .ease(d3.easeSin)
        .duration(750)
        .attr('fill', (d, _) => {
            return mapColor(d);
        });
}

function clearCountry() {
    d3.select("#text").text("Worldwide");
    curCountry = "Worldwide";
    graphData.selectAll(`*`)
        .selectAll(`*`)
        .transition()
        .style('opacity', 1);
    for (const disasterType of DISASTER_TYPES) {
        const disasterID = disasterType[0];
        let curOpacity = graphSVG.selectAll("#" + disasterID + "-legend")
            .style('opacity');
        if (curOpacity != 1) {
            graphData
                .selectAll(`#${disasterID}`)
                .transition()
                .style('opacity', 0);
        }
    }
}

function mapColor(d) {
    const code = d.properties.ISO_A3;

    // await loadData();
    const countryData = wri.filter(d => d.ISO3 === code);
    if (countryData.length === 0) return '#aaa7';
    // console.log(countryData);

    // const min = d3.least(wri, d => Number(d.WRI));
    // const max = d3.greatest(wri, d => Number(d.WRI));
    // console.log(min, max);

    // let c = countryData.pop();
    // if (c.Year !== "2022") console.log(c);
    // console.log(countryData[0]['WRI']);
    return mapColorScale(
        countryData[Number(document.getElementById('year').value) - 2000][document.getElementById('WRI_variable').value]
    );
}

function mapMouseOverHandler(event, d) {
    d3.select(this).attr('fill', HOVER_COLOR);
}

function graphMouseOverHandler(event, d) {
    let itemOpacity = graphData
        .selectAll('*')
        .selectAll('*')
        .filter(e => e.Name === d.Name)
        .style('opacity');
    // console.log(event, d, itemOpacity);
    if (itemOpacity == 0) return;

    if (curGraphHoverTimeoutID !== -1) clearTimeout(curGraphHoverTimeoutID);

    // console.log(d.Type[0], graphColor(d.Type));
    tooltip.style('opacity', 1)
        .style('border-color', graphColor(d.Type))
        .style('background-color', graphColor(d.Type).slice(0, -2) + '77');
    tooltip.html(d.Name)
        .style('left', event.pageX + 9 + 'px')
        .style('top', event.pageY - 20 + 'px');

    // lightly fade every country in map not in d.Location.split(' ')
    if (d.Location === 'Worldwide') return;

    g.selectAll('path')
        .transition()
        .ease(d3.easeSin)
        .duration(500)
        .style('opacity', 0.2);
    for (const country of d.Location.split(' ')) {
        g.selectAll(`#${country}`)
            .transition()
            .ease(d3.easeSin)
            .duration(500)
            .style('opacity', 1);
    }
}

var curGraphHoverTimeoutID = -1;
function graphMouseOutHandler(event, d) {
    curGraphHoverTimeoutID = setTimeout(() => {
        tooltip.style('opacity', 0)
        g.selectAll('path')
            .transition()
            .ease(d3.easeSin)
            .duration(500)
            .style('opacity', 1);
    }, 3000);
}

function mapMouseOutHandler(event, d) { d3.select(this).attr("fill", mapColor(d)); }

function mapClickHandler(event, d) {
    // console.log(event, d);
    let code = d.properties.ISO_A3;
    const countryData = wri.filter(d => d.ISO3 === code);
    if (countryData.length !== 0) code += `: ${countryData.pop().WRI}`;
    d3.select("#text").text(d.properties.ADMIN);
    curCountry = d.properties.ISO_A3;
    // console.log(
    //     graphData.selectAll(`.${d.properties.ADMIN}`).nodes()
    // )
    graphData.selectAll('*')
        .selectAll('*')
        .transition()
        .style('opacity', 0);

    graphData
        .selectAll(`.${d.properties.ISO_A3}`)
        .transition()
        .style('opacity', 1);

    graphData
        .selectAll('.Worldwide')
        .transition()
        .style('opacity', 1);

    for (const disasterType of DISASTER_TYPES) {
        const disasterID = disasterType[0];
        let curOpacity = graphSVG.selectAll("#" + disasterID + "-legend")
            .style('opacity');
        if (curOpacity != 1) {
            graphData
                .selectAll(`#${disasterID}.${d.properties.ISO_A3},#${disasterID}.Worldwide`)
                .transition()
                .style('opacity', 0);
        }
    }
}

const mapSVG = d3.select('#map');
const g = mapSVG.call(d3.zoom()
    .scaleExtent([.9, 20])
    .translateExtent([[0, 0], [WIDTH, HEIGHT]])
    .on('zoom', (event) => {
        g.attr('transform', event.transform);
        g.attr('stroke-width', INITIAL_BORDER_STROKE_WIDTH / event.transform.k);
    })
).append('g');

var graphData;
var graphSVG;
var curCountry = 'Worldwide';
var tooltip;
loadWorld().then(() => {
    const projection = d3.geoRobinson()
        .fitSize([WIDTH, HEIGHT], world);
    const path = d3.geoPath().projection(projection);
    loadWRI().then(() => {
        g.selectAll('path')
            .data(world.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('id', d => {
                return d.properties.ISO_A3;
            })
            .attr('fill', (d, _) => {
                // console.log(color(d));
                return mapColor(d);
            })
            .attr('stroke', 'rgb(0,0,20)')
            .on('mouseover', mapMouseOverHandler)
            .on('mouseout', mapMouseOutHandler)
            .on('click', mapClickHandler);

        loadDisasters().then(() => {
            graphSVG = d3.select('#graph');
            const graphMargin = { top: 10, right: 0, bottom: 30, left: 60 };
            const graphHeight = HEIGHT - graphMargin.top - graphMargin.bottom;
            const graphWidth = WIDTH - graphMargin.left - graphMargin.right;
            graphSVG
                .append('defs')
                .append('marker')
                .attr('id', 'arrow')
                .attr('viewBox', [0, 0, 20, 20])
                .attr('refX', 10)
                .attr('refY', 10)
                .attr('markerWidth', 5)
                .attr('markerHeight', 5)
                .attr('orient', 'auto-start-reverse')
                .append('path')
                .attr('d', d3.line()([[0, 0], [0, 20], [20, 10]]))
                .attr('stroke', '#FF1493bb')
                .attr('fill', '#FF1493bb');

            graphData = graphSVG.call(d3.zoom()
                .scaleExtent([.9, 20])
                .translateExtent([[0, 0], [WIDTH + 50, HEIGHT]])
                .on('zoom', (event) => {
                    var newX = event.transform.rescaleX(x);
                    var newY = event.transform.rescaleY(y);

                    xAxis.call(
                        d3.axisBottom(newX)
                            .tickValues(newX.ticks().filter(Number.isInteger))
                            .tickFormat(d3.format("d"))
                    );
                    xAxis.selectAll("text")
                        .attr("font-family", "Roboto")
                        .attr("font-size", "20px")
                        .attr("fill", "white");
                    xAxis.selectAll("line").attr("stroke", "red");
                    xAxis.select(".domain").attr("stroke", "white");
                    yAxis.call(d3.axisLeft(newY));
                    yAxis.selectAll("text")
                        .attr("font-family", "Roboto")
                        .attr("font-size", "20px")
                        .attr("fill", "white");
                    yAxis.selectAll("line").attr("stroke", "red");
                    yAxis.select(".domain").attr("stroke", "white");

                    graphData.attr('transform', event.transform);
                    tooltip.attr('transform', event.transform);
                })
            ).append('g');

            var x = d3.scaleLinear()
                .domain([1980, 2023])
                .range([graphMargin.left, graphWidth + graphMargin.left]);
            var xAxis = graphSVG.append("g")
                .attr("transform", "translate(0," + graphHeight + ")")
                .call(
                    d3.axisBottom(x)
                        .tickValues(x.ticks().filter(Number.isInteger))
                        .tickFormat(d3.format("d"))
                );
            xAxis.selectAll("text")
                .attr("font-family", "Roboto")
                .attr("font-size", "20px")
                .attr("fill", "white");
            xAxis.selectAll("line").attr("stroke", "red");
            xAxis.select(".domain").attr("stroke", "white");

            var y = d3.scaleLog()
                .domain([8, 50000000])
                .range([graphHeight, graphMargin.top]);
            var yAxis = graphSVG.append("g")
                .attr("transform", "translate(" + graphMargin.left + ",0)")
                .call(d3.axisLeft(y));
            yAxis.selectAll("text")
                .attr("font-family", "Roboto")
                .attr("font-size", "20px")
                .attr("fill", "white");
            yAxis.selectAll("line").attr("stroke", "red");
            yAxis.select(".domain").attr("stroke", "white");

            tooltip = d3.select("#graphdiv")
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                .style("color", "white")
                .style("font", "12px Roboto")
                .style('position', 'absolute')
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("pointer-events", "none")
                .style("padding", "5px");

            /* // mark earthquakes on map
            const earthquakes = disasters.filter(d => d.Type === 'Earthquake/Tsunami');
            console.log(earthquakes);
            g.selectAll('.disaster')
                .data(earthquakes)
                .enter()
                .append('circle')
                .attr('cx', d => projection([d.Longitude, d.Latitude])[0])
                .attr('cy', d => projection([d.Longitude, d.Latitude])[1])
                .attr('r', 1)
                .attr('fill', disasterColors[3]);
            g.selectAll('.disaster')
                .data(earthquakes)
                .enter()
                .append('circle')
                .attr('cx', d => projection([d.Longitude, d.Latitude])[0])
                .attr('cy', d => projection([d.Longitude, d.Latitude])[1])
                .attr('r', 2)
                .attr('stroke', disasterColors[3])
                .attr('stroke-width', 1)
                .attr('fill', "none"); */

            graphData.append('g')
                .selectAll("dot")
                .data(disasters.filter(d => !d.Year.includes('-')))
                .enter()
                .append("circle")
                .attr("cx", d => x(d.Year))
                .attr("cy", d => y(d.Deaths))
                .attr("r", 5)
                .attr("id", d => d.Type[0])
                .attr("class", d => d.Location)
                .attr("data-name", d => d.Name)
                .style("fill", d => graphColor(d.Type))
                .on("mouseover", graphMouseOverHandler)
                .on("mouseout", graphMouseOutHandler)
            graphData.append('g')
                .selectAll("start-dot")
                .data(disasters.filter(d => d.Year.includes('-')))
                .enter()
                .append("circle")
                .attr("cx", d => x(d.Year.split('-')[0]))
                .attr("cy", d => y(d.Deaths))
                .attr("r", 5)
                .attr("id", d => d.Type[0])
                .attr("class", d => d.Location)
                .attr("data-name", d => d.Name)
                .style("fill", d => graphColor(d.Type))
                .on("mouseover", graphMouseOverHandler)
                .on("mouseout", graphMouseOutHandler)
            graphData.append('g')
                .selectAll("end-dot")
                .data(disasters.filter(d => d.Year.includes('-') && d.Year.split('-')[1] !== 'present'))
                .enter()
                .append("circle")
                .attr("cx", d => x(d.Year.split('-')[1]))
                .attr("cy", d => y(d.Deaths))
                .attr("r", 5)
                .attr("id", d => d.Type[0])
                .attr("class", d => d.Location)
                .attr("data-name", d => d.Name)
                .style("fill", d => graphColor(d.Type))
                .on("mouseover", graphMouseOverHandler)
                .on("mouseout", graphMouseOutHandler)
            graphData.append('g')
                .selectAll("connect-dots")
                .data(disasters.filter(d => d.Year.includes('-') && d.Year.split('-')[1] !== 'present'))
                .enter()
                .append("line")
                .attr("x1", d => x(d.Year.split('-')[0]))
                .attr("y1", d => y(d.Deaths))
                .attr("x2", d => x(d.Year.split('-')[1]))
                .attr("y2", d => y(d.Deaths))
                .attr("id", d => d.Type[0])
                .attr("class", d => d.Location)
                .attr("data-name", d => d.Name)
                .attr("stroke", d => graphColor(d.Type).slice(0, -2) + "88")
                .attr("stroke-width", 2)
                .on("mouseover", graphMouseOverHandler)
                .on("mouseout", graphMouseOutHandler)
            graphData.append('g')
                .selectAll("connect-dots")
                .data(disasters.filter(d => d.Year.includes('-') && d.Year.split('-')[1] === 'present'))
                .enter()
                .append("line")
                .attr("x1", d => x(d.Year.split('-')[0]))
                .attr("y1", d => y(d.Deaths))
                .attr("x2", d => x(2023))
                .attr("y2", d => y(d.Deaths))
                .attr("stroke", d => graphColor(d.Type).slice(0, -2) + "88")
                .attr("stroke-width", 2)
                .attr("id", d => d.Type[0])
                .attr("class", d => d.Location)
                .attr("data-name", d => d.Name)
                .attr("marker-end", "url(#arrow)")
                .on("mouseover", graphMouseOverHandler)
                .on("mouseout", graphMouseOutHandler)

            graphSVG
                .selectAll("legend")
                .data([...new Set(disasters.map(d => d.Type))])
                .enter()
                .append('g')
                .append("text")
                .attr('x', (_, i) => 100)
                .attr('y', (d, i) => 50 + i * 30)
                .text(d => d)
                .style("fill", d => graphColor(d))
                .style("font", "18px Roboto")
                .attr("id", d => d[0] + "-legend")
                .on("click", (event, d) => {
                    var curClass;
                    if (curCountry === "Worldwide") {
                        curClass = "";
                    } else {
                        curClass = "." + curCountry + `,#${d[0]}.Worldwide`;
                    }

                    const selected = graphSVG.selectAll("#" + d[0] + curClass);
                    // console.log(curClass, selected.nodes());
                    let curOpacity = graphSVG.selectAll("#" + d[0] + "-legend")
                        .style("opacity");
                    graphSVG.selectAll("#" + d[0] + "-legend")
                        .transition()
                        .style("opacity", curOpacity == 1 ? 0.4 : 1);
                    if (selected.nodes().length === 0) return;

                    // console.log(
                    //     graphData.selectAll("#" + d[0] + curClass).nodes()
                    // )
                    graphSVG.selectAll("#" + d[0] + curClass)
                        .transition()
                        .style("opacity", curOpacity == 1 ? 0 : 1);
                })
        });
    });
});

document.onkeydown = e => { if (e.code === "Escape") clearCountry(); }

document.getElementById("year").onchange = onDropdownChange
document.getElementById("WRI_variable").onchange = onDropdownChange
document.getElementById("clear_country").onclick = clearCountry