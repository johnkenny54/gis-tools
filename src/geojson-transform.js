#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import commandLineArgs from "command-line-args";
import { GeoJSON } from "./geojson.js";

class Transform {

    #mapConfig;

    constructor( mapConfig ) {
        this.#mapConfig = mapConfig;
    }

    transform() {
        for ( const dirSet of this.#mapConfig.getDirectories() ) {
            this.#transform( dirSet.input, dirSet.output );
        }
    }

    #transform( inputFilePath, outputFilePath ) {

        // Initialize output directory.
        fs.rmSync( outputFilePath, { force: true, recursive: true } );
        fs.mkdirSync( outputFilePath, { recursive: true } );

        const inputFiles = fs.readdirSync( inputFilePath );
        for ( const fileName of inputFiles ) {

            // Read source file.
            const fullPath = path.join( inputFilePath, fileName );
            const srcGeoJSON = GeoJSON.readFile( fullPath );

            // Transform features.
            const features = srcGeoJSON.getFeatures();
            const newFeatures = [];
            for ( const feature of features ) {
                newFeatures.push( this.#mapConfig.transformFeature( feature ) );
            }

            // Write transformed file.
            const newGeoJSON = new GeoJSON( newFeatures );
            const fullOutputPath = path.join( outputFilePath, fileName );
            newGeoJSON.writeFile( fullOutputPath );

        }
    }

}

class MapConfig {

    #configData;

    constructor( configFilePath ) {
        this.#configData = JSON.parse( fs.readFileSync( configFilePath ) );
    }

    getDirectories() {
        return this.#configData.directories;
    }

    #getTransformedPropertyValue( srcProperties, transform ) {
        switch ( transform.type ) {
            case "constant":
                return transform.value;
            case "join": {
                const values = [];
                for ( const value of transform.value.values ) {
                    const newValue = this.#getTransformedPropertyValue( srcProperties, value );
                    if ( newValue ) {
                        const label = value.label;
                        values.push( label ? ( label + newValue ) : newValue );
                    }
                }
                return values.join( transform.value.delimiter );
            }
            case "map": {
                const input = this.#getTransformedPropertyValue( srcProperties, transform.value.input );
                const value = transform.value.map[ input ];
                return value ? value : transform.value.default;
            }
            case "property":
                return srcProperties[ transform.value ];
            default:
                throw new Error( "unknown type: " + transform.type );
        }

    }

    transformFeature( feature ) {
        const newFeature = {};
        newFeature.type = feature.type;
        newFeature.geometry = feature.geometry;
        newFeature.properties = this.#transformProperties( feature.properties );
        return newFeature;
    }

    #transformProperties( srcProperties ) {
        const newProperties = {};
        for ( const transform of this.#configData.properties ) {
            const name = transform.name;
            const value = this.#getTransformedPropertyValue( srcProperties, transform );
            if ( value ) {
                newProperties[ name ] = value;
            }
        }
        return newProperties;
    }

}

const OPTION_DEFS = [
    { name: "config-file", type: String },
];

const args = commandLineArgs( OPTION_DEFS );

const t = new Transform( new MapConfig( args[ "config-file" ] ) );

t.transform();
