/////////////////////////////////////////////
////////////// Constants ////////////////////
/////////////////////////////////////////////

/// dimensions of graphs ///
const heightRect = 100;
const height = 800;
const width = 1400;
const margin = { top: 0, bottom: 45, right: 40, left: 40 };

/// radius of the timeline circles //
const minRadiusTimeline = 4;
const maxRadiusTimeline = 16;

/// radius of the anime circles of the force graph //
const minRadiusAnime = 5;
const maxRadiusAnime = 20;

/// colours ///
const lowNumberColour = "#4361ee";
const highNumberColour = "#f72585";
const cremeWhite = "#f6f2e7";


/// All of our chart code goes here in an async function ///
async function drawChart() {

  /////////////////////////////////////////////
  ////////////////// Data /////////////////////
  /////////////////////////////////////////////

  /// 1. Read in the data ///
  const allData = await d3.json("../mal_scrape_Jan8_limited.json");

  /// 2. Data munging - for the timeline graph ///
  // transform data into just {year: 2020, number_anime: 800} type and only keep unique animes per each year 
  // step 1: group the anime by year
  const mygroup = _.groupBy(allData, function(anime) {
    return anime.air_year;
  });
  // step 2: transform the data so we end up with objects with year and number of unique anime in that year by mal_id
  const mygroupData = [];
  for (const [year, data] of Object.entries(mygroup)) {
    mygroupData.push({
      year: year,
      number_animes: _.uniqBy(data, "mal_id").length,
    });
  }
  // step 3: filter to the years that you want
  const filteredCountsList = _.filter(mygroupData, function (o) {
    return o.year >= 1970 && o.year <= 2020;
  });
  let data = filteredCountsList;

  /// 3. Data munging - for the force graph ///
  // we want to select data for just one year each time that the anime timeline is clicked
  // step 1: manually set the starting selected year
  let selectedYear = 2020;
  // step 2: filter data for selected year 
  let dataOneYear = _.filter(allData, { air_year: parseInt(selectedYear) });
  // step 3: filter just the unique anime for that year, by using mal_id
  let dataSimulation = _.uniqBy(dataOneYear, "mal_id");


  /// Graph ///
  // Select the container for the whole graph and set its width and height
  const svg = d3
    .select("#svg-container")
    .attr("width", width)
    .attr("height", height);


  /////////////////////////////////////////////
  ///////////// Timeline Graph ////////////////
  /////////////////////////////////////////////

  /// 1. Scales ///
  // X Scale - corresponds to years
  const xScale = d3.scaleBand()
    .domain(data.map(d => d["year"])) // all years
    .range([margin.left, width - margin.right])
    .padding(0.1);

  // Colour scale - number of anime per year
  const colorScale = chroma.scale([lowNumberColour, highNumberColour]
    .map(color => chroma(color).saturate(1)))
    .domain([0, 900]); // min and max of the anime per year; hardcoded

  // Number of anime scale - scale radius of circle by number of anime per year
  const numberAnimeScale = d3.scaleSqrt()
    .domain(d3.extent(data, (d) => d.number_animes))
    .range([minRadiusTimeline, maxRadiusTimeline]);


  /// 2. Axes ///
  // X Axis - years
  const xAxis = g => g
      .attr("transform", `translate(${0}, ${heightRect - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat((i) => i).tickSizeOuter(0))
      .call(g => g.select(".domain").remove())
      .call(g => g
        .selectAll("text")
          .style("fill", cremeWhite)
          .style("font-size", "0.9em")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-60)")
      )
      .call((g) => g.selectAll(".tick").style("color", cremeWhite));
  // call the axis
  svg.append("g").call(xAxis);


  /// 3. Graph ///
  // Container for the timeline - group
  const timelineG = svg.append("g").classed("timeline-g", true);

  // 3.1. Timeline circles - draw one circle for each year, coloured by number of anime
  const yearCircles = timelineG
    .selectAll(".year-circles")
    .data(data)
    .join("circle")
      .classed("year-circles", true)
      .attr("r", (d) => numberAnimeScale(d["number_animes"]))
      .attr("cx", (d) => xScale(d["year"]) + xScale.bandwidth() / 2)
      .attr("cy", heightRect / 3)
      .attr("fill", (d) => colorScale(d["number_animes"]))
      .attr("fill-opacity", 1)
      .attr("stroke", (d) => colorScale(d["number_animes"]))
      .attr("stroke-width", 8)
      .attr("stroke-opacity", 0.5);

  // 3.2. Add text with number of animes on top of each circle
  const yearCirclesText = timelineG
    .selectAll(".circles-text")
    .data(data)
    .join("text")
      .classed("circles-text", true)
      .attr("x", (d) => xScale(d["year"]) + xScale.bandwidth() / 2)
      .attr("y", heightRect / 3)
      .attr("dy", ".35em")
      .text((d) => d["number_animes"])
      .attr("fill", cremeWhite)
      .attr("font-size", "8px")
      .attr("text-anchor", "middle")
      .attr("opacity", 0.8)
      .attr("cursor", "default")
      .attr("pointer-events", "none")

  // 3.3. Set up events on the circles
  yearCircles
    .on("mouseenter", timelineMouseEnter)
    .on("mouseleave", timelineMouseLeave)
    .on("click", timelineClick);

  function timelineClick(e, datum) {
    // select the year corresponding to the circle
    // and set the data again based on the selected year
    selectedYear = datum["year"];
    dataOneYear = _.filter(allData, { air_year: parseInt(selectedYear) });
    dataSimulation = _.uniqBy(dataOneYear, "mal_id");
    // run the force graph for that year
    forceGraph(dataSimulation);
    // set the selected year in the predefined html element 
    d3.select(".whole-graph-selected-year").text(selectedYear);
  }

  function timelineMouseEnter(e, datum) {
    // expand the radius of the selected element
    d3.select(this).attr("r", (d) => 1.5 * numberAnimeScale(d["number_animes"]));
  }

  function timelineMouseLeave(e, datum) {
    // shrink the radius back to normal
    d3.select(this).attr("r", (d) => numberAnimeScale(d["number_animes"]));
  }

 

  ///////////////////////////////////////////////
  /////////////// Force Graph ///////////////////
  ///////////////////////////////////////////////

  /// 1. Scales ///
  // Popularity scale - number of members who have seen the anime
  const popularityScale = d3.scaleSqrt()
    .domain(d3.extent(allData, (d) => d.members))
    .range([minRadiusAnime, maxRadiusAnime]);


  /// 2. Graph ///
  // 2.1. Append group element to contain the whole force graph 
  const nodeG = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Construct the whole force graph inside a function so that we can call it 
  // multiple time when the data (selected year) changes
  const forceGraph = (dataSimulation) => {
    // 2.2. Circles for the force simulation - one for each anime 
    const node = nodeG
      .selectAll(".anime-circle")
      .data(dataSimulation, d => d) 
      .join("circle")
        .classed("anime-circle", true)
        .attr("r", 1) // give them a fixed radius to start from
        .attr("fill", (d) => colorScale(dataOneYear.length)) // colour by colour of the year
      // when a circle is entered, we want to display info about the anime
      .on("mouseenter", function (e, datum) {
        d3.select(this).attr("stroke", "white").attr("stroke-width", 3);
        d3.select(".whole-graph-demo-tooltip-title").text(datum.title);
        d3.select(".year").text("year: " + datum.air_year);
        d3.select(".season").text("season: " + datum.air_season);
        d3.select(".members").text("members: " + datum.members);
        d3.select(".score").text("score: " + datum.score);
      })
      // when a circle is exited, we want to hide the info about the anime
      .on("mouseleave", function (e, datum) {
        d3.select(this).attr("stroke-width", 0);
        d3.select(".whole-graph-demo-tooltip-title").text("");
        d3.select(".year").text("");
        d3.select(".season").text("");
        d3.select(".members").text("");
        d3.select(".score").text("");
      });

    // 2.3. Define the simulation 
    function tick() {
      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    }
    const simulation = d3.forceSimulation(dataSimulation, d => d)
      .on("tick", tick)
      .force("collide", d3.forceCollide().radius((d) => 1 + popularityScale(d.members))) // radius is scaled by the members i.e. popularity of the anime
      .stop();

    // 2.4. Set up a timeout - this is how long it takes for the simulation to happen
    setTimeout(() => {
      simulation.restart();
      node.transition().attr("r", (d) => popularityScale(d.members));
    }, 100);

    // 2.5. Show the initial arrangement
    tick();
  };
  forceGraph(dataSimulation);

}
drawChart();
