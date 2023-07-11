function initMap() {
  document.addEventListener("DOMContentLoaded", () => {
    class Shape {
      polygon: { lat: number; lng: number }[];
      map: any;
      bermudaTriangles: google.maps.Polygon[];

      constructor(map: any) {
        this.polygon = [];
        this.map = map;
        this.bermudaTriangles = [];
      }

      addPoint(lat: number, lng: number) {
        this.polygon.push({ lat, lng });
        if (this.polygon.length >= 3) {
          this.update(lat, lng);
        }
      }

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

      clearBermudaTriangles() {
        for (let i = 0; i < this.bermudaTriangles.length; i++) {
          google.maps.event.trigger(this.bermudaTriangles[i], "customEvent");
        }
        this.bermudaTriangles = [];
      }
    }

    var uluru = { lat: -25.363, lng: 131.044 };
    var map = new google.maps.Map(
      document.getElementById("map") as HTMLElement,
      {
        zoom: 4,
        center: uluru,
      }
    );

    let mainShape = new Shape(map);

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
  });
}
