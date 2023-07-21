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

        // gets the chosen points

        const chosen: { lat: number; lng: number; distance: number }[] = [
          top[0],
          top[1],
          top[2],
        ];

        // this goes ahead and draws the polygons on teh google map

        chosen.push(chosen[0]);
        const bermudaTriangle = new google.maps.Polygon({
          paths: chosen,
          strokeColor: "#FF000",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "FF000",
          fillOpacity: 0.35,
        });

        // this listens for customEvent, and if this it hears it will delete the triangle from the google map

        bermudaTriangle.addListener("customEvent", () => {
          bermudaTriangle.setMap(null);
        });

        // this is called everytime that we add a new point after three to add another triangel to the bermudatriangles array in the shape class

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

    // this is the event listener which is actually listening for the clear all shapes button

    const clear = document.getElementById("new_shape") as HTMLButtonElement;
    clear.addEventListener("click", () => {
      mainShape.clearBermudaTriangles();
    });

    const gridpoints = document.getElementById("getAddress") as HTMLElement;

    // this entire function right here is listening to the get addresses button
    gridpoints.addEventListener("click", async () => {
      // generate grid points  is a complex function but it returns a list of adresses that are contained within the polygons (triangles)
      let coordinates: Map<string, number> = await generategridpoints(
        mainShape
      );
      console.log(coordinates);

      // api caller gets the data about each adress from an aws lambda function
      apicaller(coordinates);
      coordinates.delete;
    });

    // ** start generate gridpoints implementation

    const generategridpoints = async (
      current: Shape
    ): Promise<Map<string, number>> => {
      // intialize coordinates

      let coordinates = new Map<string, number>();

      // iterates through every polygon in currents bermudaTriangles data array
      for (const polygon of current.bermudaTriangles) {
        console.log("someone pressed this button");

        // for ... of does not support typing, but we have to make sure that item has a type so we retype right here
        const item: google.maps.Polygon = polygon;

        // esentially what we are doing, is generating a set of grid points that will repseent a rectangel that wil always surround the triangle and be twice its area
        let highest, lowest, left, right: number;
        let latitudes: number[] = [];
        let longitudes: number[] = [];
        for (let i = 0; i < 3; i++) {
          latitudes.push(item.getPaths().getAt(0).getAt(i).lat());
          longitudes.push(item.getPaths().getAt(0).getAt(i).lng());
          console.log("we get here");
        }
        latitudes.sort((a, b) => a - b);
        longitudes.sort((a, b) => a - b);
        lowest = latitudes[0];
        highest = latitudes[latitudes.length - 1];
        left = longitudes[0];
        right = longitudes[longitudes.length - 1];

        // this code abovve  ^^^ gets the left, right, highest, and lowest points from the three polygon vertices

        // this number is important, as it determines accuracy, I have found that this is a good medium between accuracy and speed
        const interval = 0.0001;

        // this iterates through the grid that we have created

        for (let i = lowest; i < highest; i = i + interval) {
          for (let j = left; j < right; j = j + interval) {
            if (
              // heere we are checking to see whether our coordinate is actually contained within our triangle polygon
              google.maps.geometry.poly.containsLocation(
                new google.maps.LatLng(i, j),
                item
              )
            ) {
              // this returns an address if we are inside the polygon

              let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${i},${j}&key=${yourpathtokey}`;
              console.log("do we get here and i dont even");
              const response = await fetch(url);
              const data = await response.json();

              // inserts datum into a map, if the datum is already in the map appends the frequency by adding one

              if (data.results[0] != undefined) {
                if (
                  coordinates.has(data.results[0].formatted_address) == false
                ) {
                  coordinates.set(data.results[0].formatted_address, 1);
                } else {
                  let meme = coordinates.get(data.results[0].formatted_address);
                  if (meme) {
                    coordinates.set(
                      data.results[0].formatted_address,
                      meme + 1
                    );
                  }
                }
              }
            }
          }
        }
      }
      return coordinates;
    };

    // ** api caller implementation

    const apicaller = async (coordinates: Map<string, number>) => {
      let addresslist: string[] = [];
      for (let key of coordinates.keys()) {
        const keyclean = key.split(",")[0];
        console.log(keyclean);
        addresslist.push(keyclean);
      }
      console.log(addresslist);

      for (let item of addresslist) {
        let url = "";
        const response = await fetch(url);
        const data = await response.json();
        return data;
      }
    };
  });
}
