import * as fs from "node:fs";
import * as geolib from "geolib";

class GeoJSON {

    #obj;

    constructor( obj ) {
        if ( obj instanceof Array ) {
            // Assume it's a feature array.
            this.#obj = { type: "FeatureCollection", features: obj };
            return;
        }
        if ( !obj ) {
            // Initialize empty feature collection.
            obj = { type: "FeatureCollection", features: [] };
        }
        this.#obj = obj;
    }

    static getFeatureBoundsPolygon( bounds, properties = {} ) {
        const sw = bounds[ 0 ];
        const ne = bounds[ 1 ];
        const n = geolib.getLatitude( ne );
        const s = geolib.getLatitude( sw );
        const e = geolib.getLongitude( ne );
        const w = geolib.getLongitude( sw );
        const points = [ [ w, s ], [ e, s ], [ e, n ], [ w, n ], [ w, s ] ];
        return this.getFeatureSimplePolygon( points, properties );
    }

    static getFeaturePoint( point, properties ) {
        const feature = {
            type: "Feature",
            properties: properties,
            geometry: {
                type: "Point",
                coordinates: [ point.lon, point.lat ]
            }
        };
        return feature;
    }

    /**
     * 
     * @returns {Feature[]}
     */
    getFeatures() {
        return this.#obj.features;
    }

    static getFeatureSimplePolygon( points, properties ) {
        const feature = {
            type: "Feature",
            properties: properties,
            geometry: {
                type: "Polygon",
                coordinates: [ points ]
            }
        };
        return feature;
    }

    /**
     * 
     * @param {string} filePath Full path to a GeoJSON file.
     * @returns {GeoJSON}
     */
    static readFile( filePath ) {
        return new GeoJSON( JSON.parse( fs.readFileSync( filePath ) ) );
    }

    writeFile( filePath ) {
        fs.writeFileSync( filePath, JSON.stringify( this.#obj ) );
    }

}

export { GeoJSON };