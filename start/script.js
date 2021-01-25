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


  /////////////////////////////////////////////
  ///////////// Timeline Graph ////////////////
  /////////////////////////////////////////////

  /// 1. Scales ///
  // X Scale - corresponds to years


  // Colour scale - number of anime per year


  // Number of anime scale - scale radius of circle by number of anime per year



  /// 2. Axes ///
  // X Axis - years

  // call the axis



  /// 3. Graph ///
  // Container for the timeline - group

  // 3.1. Timeline circles - draw one circle for each year, coloured by number of anime


  // 3.2. Add text with number of animes on top of each circle


  // 3.3. Set up events on the circles



 

  ///////////////////////////////////////////////
  /////////////// Force Graph ///////////////////
  ///////////////////////////////////////////////

  /// 1. Scales ///
  // Popularity scale - number of members who have seen the anime


  /// 2. Graph ///
  // 2.1. Append group element to contain the whole force graph 


  // Construct the whole force graph inside a function so that we can call it 
  // multiple time when the data (selected year) changes


}
drawChart();
