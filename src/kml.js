import * as fs from "node:fs";
import { create as createXML } from "xmlbuilder2";

class KML {

    /**
     * @deprecated
     */
    static getPlacemarkData( longitude, latitude, name, description ) {
        const data = { lng: longitude, lat: latitude, name: name, desc: description };
        return data;
    }

    static rgbColorToKMLColor( rgb ) {
        if ( rgb[ 0 ] === "#" ) {
            rgb = rgb.substring( 1 );
        }
        return "ff" + rgb.substring( 4, 6 ) + rgb.substring( 2, 4 ) + rgb.substring( 0, 2 );
    }

    static write( placemarks, filePath ) {

        const root = createXML( { version: "1.0", encoding: "utf-8" } );
        const kml = root.ele( "http://www.w3.http://www.opengis.net/kml/2.2/2000/svg", "kml" );
        const xmlDoc = kml.ele( "Document" );

        for ( const placemark of placemarks ) {
            const xmlPlacemark = xmlDoc.ele( "Placemark" );

            const xmlName = xmlPlacemark.ele( "name" );
            xmlName.txt( placemark.name );

            const xmlDesc = xmlPlacemark.ele( "description" );
            xmlDesc.txt( placemark.desc );

            const xmlPoint = xmlPlacemark.ele( "Point" );
            const xmlCoords = xmlPoint.ele( "coordinates" );
            xmlCoords.txt( placemark.lng + "," + placemark.lat );

            if ( placemark[ "marker-color" ] ) {
                const xmlStyle = xmlPlacemark.ele( "Style" );
                const xmlIconStyle = xmlStyle.ele( "IconStyle" );
                const xmlColor = xmlIconStyle.ele( "color" );
                xmlColor.txt( this.rgbColorToKMLColor( placemark[ "marker-color" ] ) );
            }

        }

        // Convert the XML tree to string.
        const xml = root.end();
        fs.writeFileSync( filePath, xml );

    }

}

export { KML };