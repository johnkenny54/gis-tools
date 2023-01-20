#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { geoMercator, geoPath } from "d3-geo";
import geojsonExtent from "@mapbox/geojson-extent";
import { create as createXML } from "xmlbuilder2";
import commandLineArgs from "command-line-args";
import { exit } from "node:process";

const OPTION_DEFS = [
    { name: "config-file", type: String },
    { name: "input-file", type: String },
    { name: "output-dir", type: String, defaultValue: "." },
];

const args = commandLineArgs( OPTION_DEFS );

const inputFilePath = args[ "input-file" ];
if ( !inputFilePath ) {
    console.log( "no input file specified" );
    exit( 1 );
}
if ( !fs.existsSync( inputFilePath ) ) {
    console.log( "input file " + inputFilePath + " not found" );
    exit( 1 );
}

const outputDir = args[ "output-dir" ];
fs.mkdirSync( outputDir, { recursive: true } );

let config = {};
const configFileName = args[ "config-file" ];
if ( configFileName ) {
    config = JSON.parse( fs.readFileSync( configFileName ) );
}

const parts = path.parse( inputFilePath );
const outputFilePath = outputDir + "/" + parts.name + ".svg";

const maxWidth = 800;
const maxHeight = 600;

// Read the input file.
const geoJSON = JSON.parse( fs.readFileSync( inputFilePath ) );

// Find the extent.
const extent = geojsonExtent( geoJSON );
const h = getDistance( extent[ 0 ], extent[ 1 ], extent[ 0 ], extent[ 3 ] );
const midLat = ( extent[ 3 ] + extent[ 1 ] ) / 2;
const w = getDistance( extent[ 0 ], midLat, extent[ 2 ], midLat );
const extentRatio = w / h;
const maxRatio = maxWidth / maxHeight;
const width = ( maxRatio > extentRatio ) ? Math.round( maxWidth * extentRatio / maxRatio ) : maxWidth;
const height = ( maxRatio > extentRatio ) ? maxHeight : Math.round( maxHeight * maxRatio / extentRatio );

const projection = geoMercator();
projection.fitExtent( [ [ 0, 0 ], [ width, height ] ], geoJSON );
const getPath = geoPath( projection );

const root = createXML( { version: "1.0", encoding: "utf-8" } );
const svg = root.ele(
    "http://www.w3.org/2000/svg",
    "svg",
    { viewBox: [ 0, 0, width, height ].join( " " ) }
);
const g = svg.ele( "g", { stroke: "#000", fill: "#fff" } );

const features = geoJSON.features;
const pathAttributes = config.pathAttributes ? config.pathAttributes : {};
for ( const feature of features ) {
    const svgPath = g.ele( "path", { d: getPath( feature ) } );
    for ( const [ k, v ] of Object.entries( pathAttributes ) ) {
        svgPath.att( k, feature.properties[ v ] );
    }
}

// Convert the XML tree to string.
const xml = root.end();
fs.writeFileSync( outputFilePath, xml );

function getDistance( lon1, lat1, lon2, lat2 ) {
    const R = 6371; // km
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = ( lat2 - lat1 ) * Math.PI / 180;
    const deltaLambda = ( lon2 - lon1 ) * Math.PI / 180;

    const a = Math.sin( deltaPhi / 2 ) * Math.sin( deltaPhi / 2 ) +
        Math.cos( phi1 ) * Math.cos( phi2 ) *
        Math.sin( deltaLambda / 2 ) * Math.sin( deltaLambda / 2 );
    const c = 2 * Math.atan2( Math.sqrt( a ), Math.sqrt( 1 - a ) );

    return R * c;
}
