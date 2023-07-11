function initMap() {
  document.addEventListener("DOMContentLoaded", () => {
    class shape {
      polygon: { lat: number; lng: number }[];
      map: any
      constructor(map: any) {
        this.polygon = [];
        this.map = map
      }

      addpoint(lat: number, lng: number) {
        this.polygon.push({ lat, lng });
        if(this.polygon.length >= 3) {
          this.update(map, lat, lng)
        }
      
      }

      update(map: any, lat: number, lng: number) {
        let top: {lat: number, lng: number, distance: number} [] = [];
        this.polygon.forEach((item: {lat: number, lng: number}) => {
          let benchmark = Math.sqrt(Math.pow((lat-item.lat), 2) + Math.pow((lng - item.lng), 2))
          const selection = {
            lat: item.lat, 
            lng: item.lng, 
            distance: benchmark
          }
          top.push(selection)
          top.sort((a,b) => a.distance - b.distance);
          
        })
        const chosen: {lat: number, lng: number, distance: number} [] = [
          top[0],
          top[1],
          top[2]
        ]

        chosen.push(chosen[0])
        const bermudatriangle = new google.maps.Polygon({
          paths: chosen,
          strokeColor: "#FF000", 
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "FF000",
          fillOpacity: 0.35
          
        });

        bermudatriangle.setMap(map)
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

    let main_shape = new shape(map);
    const meme = () => {
      console.log("you clicked here");
    };
    map.addListener("click", (event) => {
      const lat = JSON.stringify(event.latLng.toJSON().lat);
      const lng = JSON.stringify(event.latLng.toJSON().lng);
      main_shape.addpoint(Number(lat), Number(lng));
      console.log(main_shape.polygon)
    });
  });
}
