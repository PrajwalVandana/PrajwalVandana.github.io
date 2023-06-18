// load geojson from countries.geojson
var world;
async function loadWorld() {
    world = await d3.json('data/countries.geojson').then(data => {
        data.features = data.features.map(feature => {
            return turf.rewind(feature, { reverse: true });
        });
        return data;
    });
}

var wri;
async function loadWRI() {
    wri = await d3.csv('data/worldriskindex-trend.csv').then(data => {
        // // find min WRI and max WRI
        // const min = d3.min(data, d => d.WRI);
        // const max = d3.max(data, d => d.WRI);
        // console.log(min, max);
        return data;
    });
}

var disasters;
async function loadDisasters() {
    disasters = await d3.tsv('data/disasters.tsv').then(data => {
        return data;
    });
}