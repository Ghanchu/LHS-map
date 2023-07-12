function initMap() {
  document.addEventListener("DOMContentLoaded", () => {
    // ** defintion for the shape class
    class Shape {
      polygon: { lat: number; lng: number }[];
      map: any;
      bermudaTriangles: google.maps.Polygon[];

      constructor(map: any) {
        this.polygon = [];
        this.map = map;
        this.bermudaTriangles = [];
      }
      // adds points on the map
      addPoint(lat: number, lng: number) {
        this.polygon.push({ lat, lng });
        if (this.polygon.length >= 3) {
          this.update(lat, lng);
        }
      }

      // updates the map with the triangles
      update(lat: number, lng: number) {
        let top: { lat: number; lng: number; distance: number }[] = [];
        this.polygon.forEach((item: { lat: number; lng: number }) => {
          let benchmark = Math.sqrt(
            Math.pow(lat - item.lat, 2) + Math.pow(lng - item.lng, 2)
          );
          const selection = {
            lat: item.lat,
            lng: item.lng,
            distance: benchmark,
          };
          top.push(selection);
          top.sort((a, b) => a.distance - b.distance);
        });

        const chosen: { lat: number; lng: number; distance: number }[] = [
          top[0],
          top[1],
          top[2],
        ];

        chosen.push(chosen[0]);
        const bermudaTriangle = new google.maps.Polygon({
          paths: chosen,
          strokeColor: "#FF000",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "FF000",
          fillOpacity: 0.35,
        });

        bermudaTriangle.addListener("customEvent", () => {
          bermudaTriangle.setMap(null);
        });

        bermudaTriangle.setMap(this.map);
        this.bermudaTriangles.push(bermudaTriangle);
      }

      // clears the entire map
      clearBermudaTriangles() {
        for (let i = 0; i < this.bermudaTriangles.length; i++) {
          google.maps.event.trigger(this.bermudaTriangles[i], "customEvent");
        }
        this.bermudaTriangles = [];
        this.polygon = [];
      }
    }

    // ** end of definition for the shape class

    var uluru = { lat: -25.363, lng: 131.044 };
    var map = new google.maps.Map(
      document.getElementById("map") as HTMLElement,
      {
        zoom: 4,
        center: uluru,
      }
    );

    let mainShape = new Shape(map);
    // start writing the logic out for the listeners and things
    map.addListener("click", (event) => {
      const lat = JSON.stringify(event.latLng.toJSON().lat);
      const lng = JSON.stringify(event.latLng.toJSON().lng);
      mainShape.addPoint(Number(lat), Number(lng));
      console.log(mainShape.polygon);
    });

    const clear = document.getElementById("new_shape") as HTMLButtonElement;
    clear.addEventListener("click", () => {
      mainShape.clearBermudaTriangles();
    });

    const gridpoints = document.getElementById("getAddress") as HTMLElement;
    gridpoints.addEventListener("click", () => {
      console.log("this event listener is working");
      generategridpoints(mainShape);
    });

    const generategridpoints = (current: Shape) => {
      console.log("we are here");
      let coordinates = new Map<string, number>();
      current.bermudaTriangles.forEach((item: google.maps.Polygon) => {
        let highest, lowest, left, right: number;
        let latitudes: number[] = [];
        let longitudes: number[] = [];
        for (let i = 0; i < 3; i++) {
          latitudes.push(item.getPaths().getAt(0).getAt(i).lat());
          longitudes.push(item.getPaths().getAt(0).getAt(i).lng());
        }
        latitudes.sort((a, b) => a - b);
        longitudes.sort((a, b) => a - b);
        lowest = latitudes[0];
        highest = latitudes[latitudes.length - 1];
        left = longitudes[0];
        right = longitudes[longitudes.length - 1];
        console.log(highest, lowest, left, right);
        const interval = 0.00005;
        for (let i = lowest; i < highest; i = i + interval) {
          for (let j = left; j < right; j = j + interval) {
            if(google.maps.geometry.poly.containsLocation(
              new google.maps.LatLng(i, j),
              item
            )) {
              console.log('down here with ' + i + " " + j)
              let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${i},${j}&key=${'AIzaSyALYNlWRTEqN_lDNrs134QSgelyoiB9FqY'}`
              fetch(url)
              .then(response => response.json()).then(data => {
                if(coordinates.get(data.results[0].formatted_address) == undefined) {
                  coordinates.set(data.results[0].formatted_address, 1)
                }
                else {
                  let meme = coordinates.get(data.results[0].formatted_address)
                  if(meme) {
                    coordinates.set(data.results[0].formatted_address, meme+1)
                  }
                  
                }
                console.log(data.results[0].formatted_address)
              })

            }
            
          }
        }
      });
      console.log(coordinates)
    };
  });
}
